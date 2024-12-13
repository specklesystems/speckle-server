# Database Monitor

Responsible for querying all databases and generating metrics.

Metrics are available at `/metrics` endpoint and are in Prometheus format.

## Development

```bash
yarn dev
```

## Databases with self-signed certificates

Add the self-signed CA certificate to a file at `packages/monitor-deployment/ca-certificate.crt`

Run `NODE_EXTRA_CA_CERTS=./ca-certificate.crt yarn dev` or `NODE_EXTRA_CA_CERTS=./ca-certificate.crt yarn start`

## Production

```bash
yarn start
```
