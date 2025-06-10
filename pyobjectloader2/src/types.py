from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Protocol, TypeVar, Union

# Type Aliases
CustomLogger = Callable[..., None]
Fetcher = Callable[..., Any] # Replace Any with a more specific type if possible

@dataclass
class Base:
    id: str
    speckle_type: str
    __closure__: Optional[Dict[str, int]] = field(default_factory=dict)

@dataclass
class Item:
    baseId: str
    base: Base
    size: Optional[int] = None

@dataclass
class Reference:
    speckle_type: str
    referencedId: str
    __closure__: Optional[Dict[str, int]] = field(default_factory=dict)

@dataclass
class DataChunk(Base):
    data: Optional[List[Base]] = field(default_factory=list)

# Utility Functions
def is_base(maybe_base: Any) -> bool:
    return isinstance(maybe_base, Base)

def is_reference(maybe_ref: Any) -> bool:
    return isinstance(maybe_ref, Reference)

def is_scalar(value: Any) -> bool:
    return value is None or isinstance(value, (str, int, float, bool)) # Python doesn't have bigint or symbol in the same way

T = TypeVar('T')
def take(it: iter, count: int) -> List[T]:
    result = []
    for _ in range(count):
        try:
            result.append(next(it))
        except StopIteration:
            break
    return result

# Error Classes
class BaseError(Exception):
    default_message = "Unexpected error occurred"
    def __init__(self, message: Optional[str] = None):
        super().__init__(message or self.default_message)

class ObjectLoaderConfigurationError(BaseError):
    default_message = "Object loader configured incorrectly!"

class ObjectLoaderRuntimeError(BaseError):
    default_message = "Object loader encountered a runtime problem!"
