const overviewPhotos:Record<string,string>={
  "/portfolio-photos-nl-es/Princessesingel-13.jpg": "netherlands",
  "/portfolio-photos-nl-es/bevrijdingsweg-39.jpg": "netherlands",
  "/portfolio-photos-nl-es/buys-ballotstraat-9.jpg": "netherlands",
  "/portfolio-photos-nl-es/calderon-de-la-barca.jpg": "spain",
  "/portfolio-photos-nl-es/declarantenweg-28.jpg": "netherlands",
  "/portfolio-photos-nl-es/declarantenweg-29.jpg": "netherlands",
  "/portfolio-photos-nl-es/declarantenweg-29A.jpg": "netherlands",
  "/portfolio-photos-nl-es/dokter-blumenkampstraat-3.jpg": "netherlands",
  "/portfolio-photos-nl-es/goethofstraat-52.jpg": "netherlands",
  "/portfolio-photos-nl-es/groethofstraat-103.jpeg": "netherlands",
  "/portfolio-photos-nl-es/groethofstraat-34.jpg": "netherlands",
  "/portfolio-photos-nl-es/groethofstraat-99.png": "netherlands",
  "/portfolio-photos-nl-es/haven-appartment.jpg": "spain",
  "/portfolio-photos-nl-es/horsterweg-180.jpg": "netherlands",
  "/portfolio-photos-nl-es/horsterweg-31.jpg": "netherlands",
  "/portfolio-photos-nl-es/kaldenkerkerweg-28.jpg": "netherlands",
  "/portfolio-photos-nl-es/kazernestraat-10.jpeg": "netherlands",
  "/portfolio-photos-nl-es/keizersveld-71.jpg": "netherlands",
  "/portfolio-photos-nl-es/la-carolina.jpg": "spain",
  "/portfolio-photos-nl-es/leeuwerikstraat-1.jpeg": "netherlands",
  "/portfolio-photos-nl-es/lomas-de-rio-verde.jpeg": "spain",
  "/portfolio-photos-nl-es/lomas-rio-verde.jpg": "spain",
  "/portfolio-photos-nl-es/los-naranjos.jpg": "spain",
  "/portfolio-photos-nl-es/magalhaesweg-4.png": "netherlands",
  "/portfolio-photos-nl-es/middelweg-25.jpg": "netherlands",
  "/portfolio-photos-nl-es/mona-lisa.jpg": "spain",
  "/portfolio-photos-nl-es/noordhoven-19.jpg": "netherlands",
  "/portfolio-photos-nl-es/noordhoven-2.jpg": "netherlands",
  "/portfolio-photos-nl-es/nusterweg-63.jpg": "netherlands",
  "/portfolio-photos-nl-es/parlevinkerstraat-1.jpg": "netherlands",
  "/portfolio-photos-nl-es/princessesingel-30.jpg": "netherlands",
  "/portfolio-photos-nl-es/rudolf-dieselweg-2-6.jpg": "netherlands",
  "/portfolio-photos-nl-es/rudolf-dieselweg-34.jpg": "netherlands",
  "/portfolio-photos-nl-es/schoenenstraat-3.jpg": "netherlands",
  "/portfolio-photos-nl-es/smakterweg-23.jpg": "netherlands",
  "/portfolio-photos-nl-es/snellius-1.jpg": "netherlands",
  "/portfolio-photos-nl-es/spoorstraat-52.jpg": "netherlands",
  "/portfolio-photos-nl-es/steegstraat-21.png": "netherlands",
  "/portfolio-photos-nl-es/tajikade-10.jpg": "netherlands",
  "/portfolio-photos-nl-es/transportlaan-1.jpg": "netherlands",
  "/portfolio-photos-nl-es/winkelveldstraat-21.jpg": "netherlands",
  "/portfolio-photos-nl-es/winkelveldstraat-24.jpg": "netherlands",
  "/portfolio-photos-nl-es/zonneveld-7.jpeg": "netherlands"
};
const spanishPhotos=new Set(["/portfolio-photos/calderon/photo1.jpg", "/portfolio-photos/calderon/photo2.jpg", "/portfolio-photos/calderon/photo3.jpg", "/portfolio-photos/haven-apartment/photo1.jpg", "/portfolio-photos/haven-apartment/photo2.jpg", "/portfolio-photos/haven-apartment/photo3.jpg", "/portfolio-photos/la-carolina/photo1.jpg", "/portfolio-photos/la-carolina/photo2.jpg", "/portfolio-photos/la-carolina/photo3.jpg", "/portfolio-photos/lomas-rio-verde/photo1.jpg", "/portfolio-photos/los-naranjos/photo1.jpg", "/portfolio-photos/los-naranjos/photo2.jpg", "/portfolio-photos/los-naranjos/photo3.jpg", "/portfolio-photos/mona-lisa/photo1.jpg", "/portfolio-photos/mona-lisa/photo2.jpg", "/portfolio-photos/mona-lisa/photo3.jpg"]);
export function assetPermissions(path:string):string[]|null {
 const overview=overviewPhotos[path];
 if(overview) {
  const specific=path.includes("los-naranjos")?"los-naranjos":path.includes("la-carolina")?"la-carolina":null;
  return ["complete",overview,...(specific?[specific]:[])];
 }
 if(spanishPhotos.has(path)) return ["spain","complete"];
 if(/^\/photos\/losnaranjos\/photo\d+\.(jpg|jpeg|png|webp)$/.test(path)) return ["los-naranjos","spain","complete"];
 if(/^\/photos\/la-carolina\/photo\d+\.(jpg|jpeg|png|webp)$/.test(path)) return ["la-carolina","spain","complete"];
 return null;
}
