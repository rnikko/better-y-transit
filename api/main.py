from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from api.exceptions import Exceptions
from api import yahoo_transit

import aiohttp
import datetime


app = FastAPI()
yt = yahoo_transit.YahooTransit()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/css", StaticFiles(directory="./dist/css"), name="css")
app.mount("/js", StaticFiles(directory="./dist/js"), name="js")


templates = Jinja2Templates(directory="./dist")


@app.get("/")
async def serve_spa(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/routes")
async def routes(fa=None, ta=None, f=None, t=None, via=None, time=None,
    time_p:str="depart_by", ic:bool=True, seat:str="unreserved", shin:bool=True, ltdexp:bool=False,
    plane:bool=False, bus:bool=False, ferry:bool=False, map_coords:int=0):
    try:
        time = datetime.datetime.strptime(time, "%Y-%m-%dT%H:%M")
    except:
        raise Exceptions.MissingArg({ "time": None })

    return await yt.search_routes(
        fa=fa, ta=ta, f=f, t=t, via=via, time=time, time_p=time_p, ic=ic,
        seat=seat, shinkansen=shin, ltdexp=ltdexp, plane=plane, bus=bus,
        ferry=ferry, map_coords=map_coords
    )


@app.get("/suggest")
async def suggest(q=None):
    if q is None or q == "":
        raise Exceptions.MissingArg({"q": q})

    return await yt.search_suggest(q)


@app.get("/reverse_geocode")
async def reverse_geocode(lat=None, lon=None):
    try:
        float(lat), float(lon)
    except:
        raise Exceptions.BadCoords(lat, lon)

    # return {"Geometry":{"Type":"point","Coordinates":"139.860042,35.666983"},"Property":{"Country":{"Code":"JP","Name":"日本"},"Address":"東京都江戸川区西葛西５丁目８－４","AddressElement":[{"Name":"東京都","Kana":"とうきょうと","Level":"prefecture","Code":"13"},{"Name":"江戸川区","Kana":"えどがわく","Level":"city","Code":"13123"},{"Name":"西葛西","Kana":"にしかさい","Level":"oaza"},{"Name":"５丁目","Kana":"５ちょうめ","Level":"aza"},{"Name":"８","Kana":"８","Level":"detail1"}],"Building":[{"Id":"B@xmnMC8J6Y","Name":"ＵＲ都市機構小島町二丁目団地４号棟","Floor":"14","Area":"2002"}]}}

    # raise Exceptions.RegionError("US")

    r = await yt.reverse_geocode(lat, lon)
    country_code = r["Property"]["Country"]["Code"]
    if country_code != "JP":
        raise Exceptions.RegionError(country_code)
    return r


@app.get("/cors-proxy")
async def cors_proxy(response:Response, url:str=""):
    session = aiohttp.ClientSession()
    r = await session.get(url, headers={"Access-Control-Allow-Origin": "*"})
    response = Response(content=await r.read())
    await session.close()
    return response


@app.exception_handler(Exceptions.RegionError)
async def region_error_ex_handler(request: Request, exc: Exceptions.RegionError):
    content = {"type": "region_unsupported", "region": exc.cc}
    return JSONResponse(status_code=400, content=content)


@app.exception_handler(Exceptions.MissingArg)
async def missing_args_ex_handler(request: Request, exc: Exceptions.MissingArg):
    return JSONResponse(status_code=400, content={"message": exc.note})


@app.exception_handler(Exceptions.BadCoords)
async def bad_coords_ex_handler(request: Request, exc: Exceptions.BadCoords):
    return JSONResponse(status_code=400, content={"message": str(exc)})


@app.exception_handler(yahoo_transit.Exceptions.YTApiError)
async def yt_apierror_ex_handler(request: Request, exc: yahoo_transit.Exceptions.YTApiError):
    content = {
        "message": "Yahoo Transit API Error",
        "status_code": exc.status_code,
        "body": exc.body
    }
        
    return JSONResponse(status_code=400, content=content)
