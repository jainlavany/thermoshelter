import os
from celery import Celery
from app.config import settings

celery_app = Celery(
    "thermoshelter_tasks",
    broker=settings.REDIS_URI,
    backend=settings.REDIS_URI
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)
