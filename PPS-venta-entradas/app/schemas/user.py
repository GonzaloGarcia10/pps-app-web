from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str | None = None


class UserCreate(UserBase):
    password: str


class UserAdminCreate(UserCreate):
    role: UserRole = UserRole.CLIENTE
    is_active: bool = True


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = None
    full_name: str | None = None
    password: str | None = None


class UserInDBBase(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    role: UserRole
    is_admin: bool


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: str
