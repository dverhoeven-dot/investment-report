export const STARTPUNT_ANALYSES = {
    residentieel: {
      inputCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4JQO904LRsVhyTE8tXiEou66YxLjiL9AYuYetnSTQG0YQbpNu1r4CFA3watW55w/pub?gid=1907487261&single=true&output=csv",
      exploitatiekostenCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4JQO904LRsVhyTE8tXiEou66YxLjiL9AYuYetnSTQG0YQbpNu1r4CFA3watW55w/pub?gid=678494986&single=true&output=csv",
      photos: ["/startpunt-analyse-photos/residentieel/photo1.png"],
      title: "Startpunt analyse",
      subtitle:
        "Rendementscheck voor residentieel vastgoed, inclusief rente, exploitatiekosten, vermogensbelasting en waardestijging.",
      footerLabel: "L3 Capital · Startpunt analyse residentieel",
      objectFallback: "Residentieel vastgoedobject",
    },
  
    bedrijfsmatig: {
      inputCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPWNvqkKFcG-LBobH1dQsMvb0M-9Teqnbc7LDcOzS_aF1sXyaabpprKrXnj_W29A/pub?gid=1907487261&single=true&output=csv",
      exploitatiekostenCsv:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPWNvqkKFcG-LBobH1dQsMvb0M-9Teqnbc7LDcOzS_aF1sXyaabpprKrXnj_W29A/pub?gid=678494986&single=true&output=csv",
        photos: ["/startpunt-analyse-photos/bedrijfsmatig/photo1.png"],
      title: "Startpunt analyse",
      subtitle:
        "Rendementscheck voor bedrijfsmatig vastgoed, inclusief rente, exploitatiekosten, vermogensbelasting en waardestijging.",
      footerLabel: "L3 Capital · Startpunt analyse bedrijfsmatig",
      objectFallback: "Bedrijfsmatig vastgoedobject",
    },
  } as const;
  
  export type StartpuntAnalyseType = keyof typeof STARTPUNT_ANALYSES;