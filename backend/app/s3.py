import sys
from io import BytesIO

import boto3
from boto3.s3.transfer import TransferConfig, create_transfer_manager
from botocore.config import Config
from botocore.exceptions import ClientError
from PIL import Image
from s3transfer.manager import TransferManager

from app import S3_ACCESS, S3_BUCKET, S3_REGION, S3_SECRET


def get_transfer_manager(workers: int = 20) -> TransferManager:
    session = boto3.Session()

    s3_config = Config(
        region_name=S3_REGION,
        signature_version="s3v4",
        retries={"max_attempts": 10, "mode": "standard"},
        max_pool_connections=workers,
    )

    s3_client = session.client(
        "s3",
        aws_access_key_id=S3_ACCESS,
        aws_secret_access_key=S3_SECRET,
        config=s3_config,
    )

    transfer_config = TransferConfig(max_concurrency=workers)
    return create_transfer_manager(s3_client, transfer_config)


def upload_image(
    s3t: TransferManager,
    object_name: str,
    image: Image.Image,
    image_format: str = "JPEG",
) -> str | None:
    img_data = BytesIO()
    image.save(img_data, format=image_format)
    img_data.seek(0)

    try:
        s3t.upload(
            img_data,
            S3_BUCKET,
            object_name,
            extra_args={
                "ContentType": f"image/{image_format.lower()}",
            },
        )
    except ClientError as e:
        print(e, file=sys.stderr)
        return None

    return f"https://{S3_BUCKET}.s3.amazonaws.com/{object_name}"
