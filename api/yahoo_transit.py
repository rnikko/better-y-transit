import aiohttp
import json

import re
import math


RE_PARENS = r"\([^)]*\)"
R_NAMES = [
    ("ＪＲ", ""),
    ("都営", ""),
    ("東京メトロ", ""),
    ("外回り", ""),
    ("内回り", ""),
    ("(", ""),
    (")", ""),
    ("（", ""),
    ("）", "")
]


def parse_color(c):
    r = int(c[:-6]) if len(c) > 6 else 0
    b = int(c[-3:])
    g = int(c[-6:-3]) if len(c) >= 6 else 0

    rgb = (r, g, b)
    return "#" + "".join([format(val, '02X') for val in rgb])


def parse_linename(name):
    for r in R_NAMES:
        name = name.replace(r[0], r[1])
    if name[-1] != "線":
        name = name.replace("線", "線・")
    if name[-3:] != "ライン":
        name = name.replace("ライン", "ライン・")
    return name


def station_coords(code, dictionary):
    lat = None
    lon = None

    if code is None or "Station" not in dictionary.keys():
        return lon, lat

    for st in dictionary["Station"]:
        if "StationCode" not in st.keys():
            continue

        if st["StationCode"] == str(code):
            coords_split = [float(n) for n in st["Geometry"]["Coordinates"].split(",")]
            lat = coords_split[1]
            lon = coords_split[0]
            break

    return lon, lat


def track_names(track):
    return track["TerminalName"] if "TerminalName" in track.keys() else track["Name"]


class YahooTransit:
    async def requestor(self, method, url, params={}, headers={}):
        session = aiohttp.ClientSession()

        if "appid" not in params.keys():
            raise Exceptions.NoAppID()

        _headers = {
            'user-agent': 'YTransit/8.10.1 (jp.co.yahoo.transit.app; build:8.10.1.1; iOS 13.5.0) Alamofire/4.8.1',
            'accept-language': 'en-US;q=1.0, ja-JP;q=0.9',
            'accept': '*/*',
        }
        _headers.update(headers)

        print("\n\n")
        print("Using headers: ", _headers)
        print("Using params: ", params)
        print("Using method: ", method)
        print("Using url: ", url)
        print("\n\n")

        response = await session.request(method, url, params=params, headers=_headers)
        if response.status >= 400 or response.content_type != "application/json":
            raise Exceptions.YTApiError(await response.text(), response.status)

        json = await response.json()
        await session.close()
        return json

    async def search_suggest(self, query):
        app_id = "dj0zaiZpPU5mUGJjNWpmV2hDZSZzPWNvbnN1bWVyc2VjcmV0Jng9OTQ-"

        params = {
            "appid": app_id,
            ".src": "rosen",
            "output": "json",
            "query": query,
            "results": 30,
        }

        headers = {"Host": "search.yahooapis.jp"}

        url = "https://search.yahooapis.jp/SuggestSearchService/V4/webassistSearch"
        r = await self.requestor("GET", url, params=params, headers=headers)

        results = []
        for rr in r["Result"]:
            if rr["Id"] != "st":
                continue

            results.append({
                "name": rr["Suggest"],
                "area": rr["Address"],
                "gid": rr["Gid"],
                "code": rr["Code"],
                "id": rr["Id"],
                "lat": float(rr["Lat"]),
                "lon": float(rr["Lon"]),
            })


        response = {
            "query": r["@query"],
            "count": len(results),
            "results": results
        }

        return response

    async def search_routes(self, fa=None, ta=None, f=None, t=None, via=None, time=None, time_p="depart_by",
        ic=True, seat="unreserved", shinkansen=True, plane=False, ltdexp=False, bus=False, ferry=False, map_coords=0):

        app_id = "Vb6lKf2xg64F_8JgwPm_y8m1fvTU6GFijzq.PEMPnMAdEg_UAJgWDl9m8JjJVLj5Cw--"

        ## add support for reverse_geocode from 
        # "from": "\u6771\u4EAC\u90FD\u6E2F\u533A\u516D\u672C\u6728\uFF13\u4E01\u76EE\uFF11\uFF13,139.733871,35.662716"
        ## doesn't support via

        params = {
            "appid": app_id,
            "date": time.strftime("%Y%m%d%H%M"),
            "ticket": "ic" if ic else "normal",
            "ws": 3, # walk speed (1 -> 4)
            "results": 6,
            "congestion": 1,
            "ei": 'utf-8',
            "output": 'json',
            "detail": 'full',
            "engine": 'transit',
            "s": 0,
            "qp": 1,
            "pri": 0,
            "split": 1,
            "device": 3,
            "divied": 1,
            "lsinfo": 1,
            "weburl": 1,
            "weather": 1,
            "serialize": 1,
            "rtm_irr_cng": 1,
            "tcode": t,
            "fcode": f
        }

        if ta:
            del params["tcode"]
            params["to"] = ta

        if fa:
            del params["fcode"]
            params["from"] = fa

        if via:
            params["via"] = via

        if seat == "reserved":
            params["expkind"] = 2
        elif seat == "green_car":
            params["expkind"] = 3
        else:
            params["expkind"] = 1

        if time_p == "arrive_by":
            params["type"] = 4
        elif time_p == "first_train":
            params["type"] = 3
        elif time_p == "last_train":
            params["type"] = 2
        else:
            params["type"] = 1

        ride_opts = []

        if shinkansen:
            ride_opts.append("se")
        if ltdexp:
            ride_opts.append("ex")
        if plane:
            ride_opts.append("al")
        if bus:
            ride_opts.append("hb")
            ride_opts.append("lb")
        if ferry:
            ride_opts.append("sr")

        params["ptn"] = ", ".join(ride_opts)

        if map_coords is not None and 0 < map_coords <= 6:
            params["mode"] = "rendering"
            params["start"] = int(map_coords)

        headers = {"Host": "transit.yahooapis.jp"}

        url = "https://transit.yahooapis.jp/v2/naviSearch"
        response = await self.requestor("GET", url, params=params, headers=headers)

        # no route messages when no RouteInfo
        # error response, but not 400-500+

        count = response["ResultInfo"]["Count"]
        latency = response["ResultInfo"]["Latency"]
        results = []

        import json
        filename = f"""{f}_{t}_{time.strftime("%Y%m%d%H%M")}"""
        if map_coords:
            filename += "_map_coords"
        with open(f"responses\\{filename}.json", "w") as f:
            json.dump(response, f)
            print(f"\nsaved to file (\\responses\\{filename}.json)\n")


        if map_coords:
            for i, f in enumerate(response["Feature"], 0):
                target = f["Style"]["Target"]
                coords = [[float(c.split(",")[0]), float(c.split(",")[1])] for c in f["Geometry"]["Coordinates"].split(" ")]

                if target == 0 and "Name" not in f.keys():
                    target = -1

                start_code = None
                end_code = None

                if "RouteInfo" in f.keys() and "Vertex" in f["RouteInfo"]["Edge"].keys():
                    stations = f["RouteInfo"]["Edge"]["Property"]["Stations"].split(",")
                    start_code = f["RouteInfo"]["Edge"]["Vertex"]["Station"]
                    end_code = stations[stations.index(start_code) + 1]

                if target == 0 and len(results) > 0 and results[-1]["target"] == 0:
                    results[-1]["coords"] += coords

                else:
                    results.append({
                        "target": target,
                        "start_code": start_code,
                        "end_code": end_code,
                        "coords": coords
                    })

        else:
            for route_num, r in enumerate(response["Feature"], 0):
                route = {
                    "tags": {
                        "cheap": True if int(r["RouteInfo"]["Property"]["Sort"]["Cheap"]) else False,
                        "convenient": True if int(r["RouteInfo"]["Property"]["Sort"]["Easy"]) else False,
                        "fast": True if int(r["RouteInfo"]["Property"]["Sort"]["Fast"]) else False,
                    },
                    "distance_km": float(r["RouteInfo"]["Property"]["Distance"]) / 10,
                    "duration_min": int(r["RouteInfo"]["Property"]["TimeOnBoard"]) + int(r["RouteInfo"]["Property"]["TimeOther"]) + int(r["RouteInfo"]["Property"]["TimeWalk"]),
                    "transfers": int(r["RouteInfo"]["Property"]["TransferCount"]),
                    "total_fare_yen": int(r["RouteInfo"]["Property"]["TotalPrice"]["TotalPrice"].replace(",", "")),
                    "legs": []
                }

                legs = r["RouteInfo"]["Edge"]

                for leg_num, l in enumerate(legs, 0):
                    l = l["Property"]

                    depart_time = l["DepartureUnixTimestamp"] if "DepartureUnixTimestamp" in l.keys() else None
                    arrive_time = l["ArrivalUnixTimestamp"] if "ArrivalUnixTimestamp" in l.keys() else None

                    notices = []
                    if "LineService" in l.keys() and len(l["LineService"]["info"]) > 0:
                        for i in l["LineService"]["info"]:
                            if i["status"] == "":
                                continue

                            notices.append({
                                "message": i["status"][0]["longText"],
                                "cause": i["status"][0]["causeName"],
                                "impact_range": i["status"][0]["impactRange"],
                            })

                    passing_stations = []

                    origin = {
                        "name": None,
                        "code": None,
                        "platform": None,
                        "lat": None,
                        "lon": None
                    }

                    destination = {
                        "name": None,
                        "code": None,
                        "platform": None,
                        "lat": None,
                        "lon": None
                    }

                    if "StopStation" in l.keys():
                        for st in l["StopStation"][1:-1]:
                            passing_stations.append({
                                "name": st["Name"],
                                "time": st["DepartureUnixTimestamp"] if "DepartureUnixTimestamp" in st.keys() else None,
                                "code": str(st["Code"]),
                            })

                        f = l["StopStation"][0]
                        origin["name"] = f["Name"]
                        origin["code"] = str(f["Code"])

                        t = l["StopStation"][-1]
                        destination["name"] = t["Name"]
                        destination["code"] = str(t["Code"])

                    # set plat
                    if "Track" in l.keys():
                        origin["platform"] = track_names(l["Track"][0])
                        destination["platform"] = track_names(l["Track"][-1])

                    # set coords
                    origin_coords = station_coords(origin["code"], response["Dictionary"])
                    origin["lat"] = origin_coords[1]
                    origin["lon"] = origin_coords[0]

                    destination_coords = station_coords(destination["code"], response["Dictionary"])
                    destination["lat"] = destination_coords[1]
                    destination["lon"] = destination_coords[0]

                    name_split = r["Name"].split("-")
                    if l["RailName"] == "徒歩" or l["RailName"] == "徒歩(同駅)":
                        t_type = "walk"
                        l["Color"] = "120120120"

                    elif "出口" in l["RailName"] or "GateList" in l.keys():
                        t_type = "station_exit"
                        l["Color"] = "234203000"

                    elif "AirportCPName" in l.keys():
                        t_type = "flight"

                    else:
                        t_type = "line"

                    if t_type == "walk" or t_type == "station_exit":
                        if leg_num == 0:
                            origin["name"] = name_split[0]
                        elif leg_num == len(legs) - 1:
                            destination["name"] = name_split[1]

                    transport = {
                        "type": t_type,
                        "name": parse_linename(l["RailName"]),
                        "direction": l["Destination"] if "Destination" in l.keys() else None,
                        "icon": l["IconUrl"] if "IconUrl" in l.keys() else None,
                        "icon_color": parse_color(l["Color"]),
                    }

                    # bodge fix for 徒歩(同駅) legs in route
                    if leg_num > 0 and route["legs"][-1]["transport"]["name"] == "徒歩同駅":
                        route["legs"][-1]["destination"] = origin
                        if route["legs"][-1]["origin"] is None:
                            route["legs"][-1]["origin"] = route["legs"][-2]["destination"]

                    route["legs"].append({
                        "depart_time": depart_time,
                        "arrive_time": arrive_time,
                        "origin": origin,
                        "destination": destination,
                        "passing_stations": passing_stations,
                        "transport": transport,
                        "notices": notices,
                        "bounds": [],
                    })

                route["start_time"] = route["legs"][0]["depart_time"]
                route["end_time"] = route["legs"][-1]["arrive_time"]

                results.append(route)

            # set origin and destination for walk / station_exit legs
            for route in results:
                legs = route["legs"]
                for leg_num, l in enumerate(legs, 0):
                    t_type = l["transport"]["type"]
                    walk_or_exit = t_type == "walk" or t_type == "station_exit"

                    if walk_or_exit and leg_num < len(legs) - 1:
                        l["destination"] = legs[leg_num+1]["origin"]

                    if walk_or_exit and leg_num > 0:
                        l["origin"] = legs[leg_num-1]["destination"]

        return {
            "count": count,
            "latency": latency,
            "results": results
        }

    async def reverse_geocode(self, lat, lon):
        params = {
            "appid": "5pcatUWxg66zYvIk2OwL8d17zSWX41dNDCx5U9zGh_5MWzKpCXoeMMO.UwGVeksF5Q--",
            "output": "json",
            "result": 1,
            "start": 1,
            "lat": lat,
            "lon": lon,
        }

        headers = {"Host": "map.yahooapis.jp"}

        url = "https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder"
        r = await self.requestor("GET", url, params=params, headers=headers)

        result = None
        if "Feature" in r.keys() and len(r["Feature"]) > 0:
            result = r["Feature"][0]

        return result



class Exceptions:
    class YTApiError(Exception):
        def __init__(self, body, status_code):
            self.status_code = status_code
            self.body = body
            self.note = f"Status Code: {status_code}\n Response Body: {self.body}"
        def __str__(self):
            return self.note

    class NoAppID(Exception):
        def __init__(self):
            self.note = f"\'appid\' missing in request params"
        def __str__(self):
            return self.note
