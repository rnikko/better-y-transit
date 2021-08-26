class Exceptions(object):
    class MissingArg(Exception):
        def __init__(self, args):
            self.note = "Missing or bad argument for"
            for k, v in args.items():
                if v is None or v == "":
                    self.note += f" \'{k}\'"
        def __str__(self):
            return self.note

    class BadCoords(Exception):
        def __init__(self, lat, lon):
            self.lat = lat
            self.lon = lon

        def __str__(self):
            if self.lat is None:
                return "Missing value for \'lat\'"
            elif self.lon is None:
                return "Missing value for \'lon\'"
            else:
                return f"Invalid coordinates (lat: \'{self.lat}\', lon: \'{self.lon}\')"

    class RegionError(Exception):
        def __init__(self, country_code):
            self.cc = country_code
