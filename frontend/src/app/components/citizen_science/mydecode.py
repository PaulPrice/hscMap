import sys
import json
import base64


def main():
    data = json.loads(base64.b64decode(sys.stdin.read()))
    json.dump(data, sys.stdout, indent=2)


main()
