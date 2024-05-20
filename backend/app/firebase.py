import json
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app import FIREBASE_COLLECTION, FIREBASE_CREDENTIALS, FIREBASE_TTL


class FirebaseManager:
    def __init__(self) -> None:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(json.loads(FIREBASE_CREDENTIALS)))
        self.db = firestore.client()
        self.collection = self.db.collection(FIREBASE_COLLECTION)

    def add_document(
        self,
        image: str,
        image_hash: str,
        prediction: str,
        confidence_map: dict[str, float],
        heatmaps: list[str],
        boxmaps: list[str],
        user_id: str,
        flagged: list[str] = [],
    ) -> str:
        current_timestamp = datetime.now()
        doc_ref = self.collection.add(
            {
                "hash": image_hash,
                "image": image,
                "prediction": prediction,
                "confidence": confidence_map,
                "heatmaps": heatmaps,
                "boxmaps": boxmaps,
                "flagged": flagged,
                "user_id": user_id,
                "timestamp": current_timestamp.isoformat(),
                "expireAt": (current_timestamp + timedelta(days=FIREBASE_TTL)).isoformat(),
            }
        )
        return doc_ref[1].id

    def find_by_image(self, image_hash: str, user_id: str) -> tuple[str, dict] | None:
        query = self.collection.where(filter=FieldFilter("hash", "==", image_hash))

        found = query.where(filter=FieldFilter("user_id", "==", user_id)).get()
        if len(found) == 0:
            found = query.where(filter=FieldFilter("user_id", "==", "anonymous")).get()

        return (found[0].id, found[0].to_dict()) if found else None

    def update_flagged(self, doc_id: str, flagged: list[int]) -> None:
        doc_ref = self.collection.document(doc_id)
        doc_ref.update({"flagged": flagged})

    def get_user_history(self, user_id: str) -> list[dict]:
        query = self.collection.where(filter=FieldFilter("user_id", "==", user_id)).get()
        return [{"id": doc.id, **doc.to_dict()} for doc in query]
