#!/usr/bin/env python3

import os
import socket
import subprocess
import secrets
import ruamel.yaml  # this module preserves yaml comments and whitespaces
from ruamel.yaml.scalarstring import DoubleQuotedScalarString

FILE_PATH = os.path.dirname(os.path.abspath(__file__))

LOGO_STR = '''
 _____                 _    _      _____
/  ___|               | |  | |    /  ___|
\ `--. _ __   ___  ___| | _| | ___\ `--.  ___ _ ____   _____ _ __
 `--. \ '_ \ / _ \/ __| |/ / |/ _ \`--. \/ _ \ '__\ \ / / _ \ '__|
/\__/ / |_) |  __/ (__|   <| |  __/\__/ /  __/ |   \ V /  __/ |
\____/| .__/ \___|\___|_|\_\_|\___\____/ \___|_|    \_/ \___|_|
      | |
      |_|
'''

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    if not ip:
        print("Error: Can't get local IP address")
        exit(1)
    return ip


def read_domain(ip):
    print("\nYou can set up a domain name for this Speckle server.")
    print("Important: To use a domain name, you must first configure it to point to this VM address (so we can issue the SSL certificate)")
    print(f"VM address: {ip}")
    while True:
        domain = input(f'Domain name (leave blank to use the IP address): ').strip()
        if not domain:
            return None
        try:
            domain_ip = socket.gethostbyname(domain.strip())
        except Exception as ex:
            print(f"Error: Domain '{domain}' cannot be resolved: {str(ex)}")
            continue

        if domain_ip != ip:
            print(f"Error: Domain '{domain}' points to {domain_ip} instead of {ip}")
            continue

        return domain


def read_email_settings(domain):
    print("\nYou should configure an email provider to allow the Speckle Server to send emails.")
    print("Supported vendors: Any email provider that can provide SMTP connection details (mailjet, mailgun, etc).")
    print("Important: If you don't configure email details, some features that require sending emails will not work, nevertheless the server should be functional.")
    while True:
        enable_email = False
        while True:
            enable_email = input("Enable emails? [Y/n]: ").strip().lower()
            if enable_email in ['n', 'no']:
                enable_email = False
                break
            elif enable_email in ['', 'y', 'yes']:
                enable_email = True
                break
            else:
                print("Unrecognized option")
                continue

        if not enable_email:
            return None

        print("Enter your SMTP connection details offered by your email provider")
        smtp_host = input("SMTP server / host: ").strip()
        smtp_port = input("SMTP port: ").strip()
        try:
            int(smtp_port)
        except Exception:
            print('Error: SMTP port must be a number. Retrying...')
            continue
        smtp_user = input("SMTP Username: ").strip()
        smtp_pass = input("SMTP Password: ").strip()

        if domain:
            default_from_email = 'no-reply@' + domain
        else:
            default_from_email = ''
        email_from = input(f"Email address to send email as [{default_from_email}]: ")
        if not email_from.strip():
            email_from = default_from_email

        if not smtp_host or not smtp_port or not smtp_user or not smtp_pass or not email_from:
            print("Error: One or more fields were empty. Retrying...")
            continue

        return {
            'host': smtp_host,
            'port': smtp_port,
            'user': smtp_user,
            'pass': smtp_pass,
            'from': email_from
        }


def main():
    print(LOGO_STR)
    ip = get_local_ip()

    ###
    ### Read user input
    #########
    domain = read_domain(ip)
    if domain:
        canonical_url = f'https://{domain}'
    else:
        canonical_url = f'http://{ip}'

    email = read_email_settings(domain)

    ###
    ### Create docker-compose.yml from the template
    #########
    print("\nConfiguring docker containers...")

    yaml = ruamel.yaml.YAML()
    yaml.preserve_quotes = True
    with open(os.path.join(FILE_PATH, 'template-docker-compose.yml'), 'r') as f:
        yml_doc = yaml.load(f)
    env = yml_doc['services']['speckle-server']['environment']
    env['CANONICAL_URL'] = DoubleQuotedScalarString(canonical_url)
    env['SESSION_SECRET'] = DoubleQuotedScalarString(secrets.token_hex(32))
    if email:
        env['EMAIL'] = DoubleQuotedScalarString('true')
        env['EMAIL_HOST'] = DoubleQuotedScalarString(email['host'])
        env['EMAIL_PORT'] = DoubleQuotedScalarString(email['port'])
        env['EMAIL_USERNAME'] = DoubleQuotedScalarString(email['user'])
        env['EMAIL_PASSWORD'] = DoubleQuotedScalarString(email['pass'])
        env['EMAIL_FROM'] = DoubleQuotedScalarString(email['from'])
    else:
        env['EMAIL'] = DoubleQuotedScalarString('false')

    with open(os.path.join(FILE_PATH, 'docker-compose.yml'), 'w') as f:
        f.write('# This file was generated by SpeckleServer setup.\n')
        f.write('# If the setup is re-run, this file will be overwritten.\n\n')
        yaml.dump(yml_doc, f)

    ###
    ### Run the new docker-compose file (will update containers if already running)
    #########
    subprocess.run(['bash', '-c', f'cd "{FILE_PATH}"; docker-compose up -d'], check=True)


    ###
    ### Update nginx config and restart nginx
    #########
    print("\nConfiguring local nginx...")

    nginx_conf_str = '# This file is managed by SpeckleServer setup script.\n'
    nginx_conf_str += '# Any modifications will be removed when the setup script is re-executed\n\n'
    with open(os.path.join(FILE_PATH, 'template-nginx-site.conf'), 'r') as f:
        nginx_conf_str += f.read()
    if domain:
        nginx_conf_str = nginx_conf_str.replace('TODO_REPLACE_WITH_SERVER_NAME', domain)
    else:
        nginx_conf_str = nginx_conf_str.replace('TODO_REPLACE_WITH_SERVER_NAME', '_')
    with open('/etc/nginx/sites-available/speckle-server', 'w') as f:
        f.write(nginx_conf_str)
    subprocess.run(['nginx', '-s', 'reload'], check=True)

    ###
    ### Run letsencrypt on new config
    #########
    if domain:
        print("\n***")
        print("*** Will now run LetsEncrypt utility to generate https certificate. Please answer any questions that are presented")
        print("*** We highly recommend setting a good email address so that you are notified if there is any action needed to renew certificates")
        print("***")
        subprocess.run(['certbot', '--nginx', '-d', domain])

    print("\nConfiguration complete!")
    print("You can access your speckle server at: " + canonical_url)
    print(LOGO_STR)
    print("\nOne more thing and you are ready to roll:")
    print(f" - Go to {canonical_url} in your browser and create an account. The first user to register will be granted administrator rights.")
    print(" - Fill in information about your server under your profile page (in the lower left corner).")
    print("\nHappy Speckling!")


if __name__ == '__main__':
    main()
