#!/usr/bin/env python3
"""Download the pre-trained TF.js ASL model into public/model/."""

import os
import sys
import tarfile
import urllib.request

MODEL_DIR = "client/public/model"
MODEL_URL = "https://huggingface.co/dactylology/asl-alphabet/resolve/main/model.tar.gz"


def main() -> None:
    os.makedirs(MODEL_DIR, exist_ok=True)
    archive = "/tmp/asl-model.tar.gz"

    print(f"Downloading model from {MODEL_URL} ...")
    try:
        urllib.request.urlretrieve(MODEL_URL, archive)
    except Exception as exc:
        print(f"Download failed: {exc}", file=sys.stderr)
        sys.exit(1)

    print("Extracting ...")
    with tarfile.open(archive) as tf:
        tf.extractall(MODEL_DIR)

    print(f"Done. Model files in {MODEL_DIR}/")
    print("Reload the app to start using it.")


if __name__ == "__main__":
    main()
