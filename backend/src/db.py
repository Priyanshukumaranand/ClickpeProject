import os
import pg8000.native as pg
from typing import Iterable, Sequence, Any


class Database:
    def __init__(self) -> None:
        self.host = os.environ.get("PG_HOST")
        self.port = int(os.environ.get("PG_PORT", "5432"))
        self.database = os.environ.get("PG_DATABASE")
        self.user = os.environ.get("PG_USER")
        self.password = os.environ.get("PG_PASSWORD")

    def _connect(self):
        if not all([self.host, self.database, self.user, self.password]):
            raise RuntimeError("Database credentials are not fully configured")
        return pg.Connection(
            user=self.user,
            password=self.password,
            host=self.host,
            port=self.port,
            database=self.database,
            timeout=30,
        )

    def executemany(self, sql: str, rows: Iterable[Sequence[Any]]) -> int:
        conn = self._connect()
        try:
            cursor = conn.cursor()
            cursor.executemany(sql, rows)
            conn.commit()
            return cursor.rowcount
        finally:
            conn.close()
