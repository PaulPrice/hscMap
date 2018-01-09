import json
import sys

data = json.load(sys.stdin)
data = [row for row in data if row['specz'] < 0.1]

for row in data:
    row['id'] = str(row['id'])

json.dump(data, sys.stdout, indent=2)
