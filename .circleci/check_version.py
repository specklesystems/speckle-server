#!/usr/bin/python3
import sys
from typing import Optional
from dataclasses import dataclass

@dataclass
class Version:
    major: int
    minor: int
    patch: int
    pre_release_tag: Optional[str] = None
    build_number: Optional[int] = None

    @property
    def pre_release_priority(self) -> int:
        if self.pre_release_tag == 'alpha':
            return 1
        if self.pre_release_tag == 'beta':
            return 2
        return 10


    @staticmethod
    def parse_version_slug(version_slug: str) -> "Version":
        members = version_slug.split(".") 
        assert(3 <= len(members) <= 4)
        if len(members) == 3:
            major, minor, patch = members
            return Version(int(major), int(minor), int(patch))
        
        else:
            major, minor, patch_and_pre, build = members
            patch, pre = patch_and_pre.split("-")
            return Version(int(major), int(minor), int(patch), pre, int(build))

    def __gt__(self, other):
        if not isinstance(other, Version):
            raise ValueError(f'cannot compare with {other}') 
        
        if self.major > other.major:
            return True
        if self.major < other.major:
            return False

        if self.minor > other.minor:
            return True
        if self.minor < other.minor:
            return False
        
        if self.patch > other.patch:
            return True
        if self.patch < other.patch:
            return False

        if self.pre_release_tag == other.pre_release_tag:
            if self.build_number > other.build_number:
                return True
            if self.build_number < other.build_number:
                return False

        if self.pre_release_priority > other.pre_release_priority:
            return True
        if self.pre_release_priority < other.pre_release_priority:
            print('foo')
            return False
        
        return True

if __name__ == "__main__":
    print("\nStarting version compare\n")
    args = sys.argv[1:]
    assert(len(args) == 2)

    current_version_slug, target_version_slug = args

    print(f"comparing current version {current_version_slug} with target {target_version_slug}")

    current_version = Version.parse_version_slug(current_version_slug)
    target_version = Version.parse_version_slug(target_version_slug)

    if (target_version > current_version):
        print("target version is newer\n")
        exit(0)

    print("current version is newer\n")    
    exit(1)
