import csv

INPUT_FILE = "mvr-accidents-dataset.csv"
OUTPUT_FILE = "accidents-clean.csv"

def to_float(value: str):
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    value = value.replace(",", ".")
    try:
        return float(value)
    except ValueError:
        return None


def yes_no_to_int(value: str) -> int:
    value = (value or "").strip().lower()
    return 1 if value == "да" else 0


with open(INPUT_FILE, "r", encoding="utf-8-sig", newline="") as infile, \
     open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as outfile:

    reader = csv.DictReader(infile, delimiter=";")
    writer = csv.writer(outfile)
    writer.writerow(["latitude", "longitude", "injury", "death"])

    for row in reader:
        lat = to_float(row.get("y"))
        lon = to_float(row.get("x"))

        if lat is None or lon is None:
            continue

        injury = yes_no_to_int(row.get("injured"))
        death = yes_no_to_int(row.get("died"))

        writer.writerow([lat, lon, injury, death])

print(f"Done. Cleaned file saved as {OUTPUT_FILE}")