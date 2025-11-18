from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Monkey-patch passlib's bcrypt bug detection to handle the 72-byte limit
# This prevents errors during CryptContext initialization
try:
    import passlib.handlers.bcrypt as bcrypt_module
    
    # Patch _finalize_backend_mixin to catch ValueError during bug detection
    original_finalize = bcrypt_module._BcryptBackend._finalize_backend_mixin
    
    @classmethod
    def safe_finalize_backend_mixin(cls, name, dryrun=False):
        """Wrapper that handles 72-byte limit errors during bug detection"""
        try:
            return original_finalize(name, dryrun)
        except ValueError as e:
            if "password cannot be longer than 72 bytes" in str(e):
                # If bug detection fails due to password length, skip it
                # Return True to indicate backend is ready (no bug detected)
                return True
            raise
    
    bcrypt_module._BcryptBackend._finalize_backend_mixin = safe_finalize_backend_mixin
except (ImportError, AttributeError) as e:
    # If monkey-patching fails, continue anyway
    pass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_password(password: str) -> str:
    """Truncate password to 72 bytes, handling UTF-8 boundaries correctly"""
    if not isinstance(password, str):
        return password
    
    password_bytes = password.encode('utf-8')
    if len(password_bytes) <= 72:
        return password
    
    # Truncate to 72 bytes
    truncated_bytes = password_bytes[:72]
    
    # Remove any incomplete UTF-8 sequences at the end
    # UTF-8 continuation bytes start with 10xxxxxx (0x80-0xBF)
    # We need to remove trailing continuation bytes that aren't part of a complete sequence
    while truncated_bytes:
        last_byte = truncated_bytes[-1]
        # If it's a continuation byte (starts with 10), remove it
        if (last_byte & 0xC0) == 0x80:
            truncated_bytes = truncated_bytes[:-1]
        else:
            break
    
    # Decode and re-encode to ensure it's valid and still <= 72 bytes
    try:
        truncated_str = truncated_bytes.decode('utf-8')
        # Double-check the length after re-encoding
        if len(truncated_str.encode('utf-8')) > 72:
            # If still too long, truncate character by character
            while len(truncated_str.encode('utf-8')) > 72 and truncated_str:
                truncated_str = truncated_str[:-1]
        return truncated_str
    except UnicodeDecodeError:
        # Fallback: truncate character by character
        truncated_str = password
        while len(truncated_str.encode('utf-8')) > 72 and truncated_str:
            truncated_str = truncated_str[:-1]
        return truncated_str


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Bcrypt has a 72-byte limit, truncate if necessary
    plain_password = _truncate_password(plain_password)
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Bcrypt has a 72-byte limit, truncate if necessary
    password = _truncate_password(password)
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    # Convert UUID to string if present
    if 'sub' in to_encode and hasattr(to_encode['sub'], '__str__'):
        to_encode['sub'] = str(to_encode['sub'])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        # Convert 'sub' to string if it's a UUID
        if 'sub' in payload:
            payload['sub'] = str(payload['sub'])
        return payload
    except JWTError:
        return None

