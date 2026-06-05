from pydantic import BaseModel, Field, field_validator, model_validator

_MAX_PATHS = 32
_MAX_PATH_LEN = 2048


class MonitorPathsUpdate(BaseModel):
    paths: list[str] = Field(default_factory=list, max_length=_MAX_PATHS)

    @field_validator("paths", mode="before")
    @classmethod
    def coerce_paths(cls, v: object) -> list[str]:
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        out: list[str] = []
        for p in v:
            s = str(p).strip()
            if len(s) > _MAX_PATH_LEN:
                s = s[:_MAX_PATH_LEN]
            if s:
                out.append(s)
        return out

    @model_validator(mode="after")
    def dedupe_preserve_order(self) -> "MonitorPathsUpdate":
        seen: set[str] = set()
        unique: list[str] = []
        for p in self.paths:
            if p not in seen:
                seen.add(p)
                unique.append(p)
        self.paths = unique
        return self
