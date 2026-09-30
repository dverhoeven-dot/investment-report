# Je website met persoonlijke accounts

De nieuwe code is klaar om lokaal te testen. Er is niets gepubliceerd en je GitHub is niet aangepast.

## Stap 1 — Terugzetten in Cursor

1. Sluit een eventueel draaiende lokale website af in de terminal met Ctrl+C.
2. Maak een kopie van je huidige projectmap als reservekopie.
3. Pak deze zip uit in een tijdelijke map.
4. Open de map `investment` uit de uitgepakte zip.
5. Kopieer de inhoud daarvan naar je bestaande projectmap: de map waar `app`, `public` en `package.json` staan.
6. Kies **bestanden vervangen** wanneer Windows dat vraagt.

Je kopieert de inhoud; je hoeft dus geen tweede map `investment` binnen je project te maken. Verwijder je bestaande `public`, `.env.local` of `.git` niet. Die zitten bewust niet in dit pakket. Eventueel staat er nog een oude losse map `leovari-portaal`; verplaats die buiten je project zodat de oude voorbeeldbestanden niet worden meegerekend bij typecontrole of build.

## Stap 2 — Pakketten installeren

Open in Cursor de terminal, in je projectmap. Voer dit uit:

```bash
npm ci
```

Gebruik Node.js 22 of 24. Je kunt de versie bekijken met `node --version`.

## Stap 3 — Je eerste medewerkeraccount maken

Voer uit:

```bash
npm run portal:setup
```

Vul je naam, e-mailadres en een eigen wachtwoord van minimaal 12 tekens in. Herhaal het wachtwoord. Tijdens het typen van het wachtwoord verschijnt niets in de terminal; dat hoort zo.

Je wachtwoord wordt niet in een tekstbestand bewaard. Het script maakt de lokale accountdatabase aan en voegt, als die ontbreekt, alleen `TURSO_DATABASE_URL=file:portal-local.db` toe aan je bestaande `.env.local`. Je bestaande instellingen blijven behouden. Als er al accounts zijn, meldt het script dat en maakt het geen tweede eerste account aan.

## Stap 4 — Lokaal openen

Voer uit:

```bash
npm run dev
```

Open daarna:

http://localhost:3000/login

Log in met het account uit stap 3. Kies **Gebruikers beheren** om accounts toe te voegen.

- **Medewerker**: alles bekijken, gegevens aanpassen en accounts beheren.
- **Externe gebruiker**: uitsluitend de onderdelen bekijken die je aanvinkt. Geen gegevens aanpassen, importeren, verwijderen of opslaan.
- **QA** en **New project**: alleen medewerkers.
- Zet **Account actief** uit om een account te blokkeren. Bij wijziging van een account vervallen de bestaande sessies; de gebruiker logt opnieuw in.

## Stap 5 — Zelf één extern account testen

Maak een testaccount met alleen **Project Los Naranjos**. Log als medewerker uit en log in met het testaccount.

Je ziet alleen de knop voor dat project. Probeer ook rechtstreeks `/complete-portfolio`, `/reports/la-carolina` en `/beheer`: die moeten worden geweigerd.

Accounts die je lokaal maakt, staan alleen in de lokale database. Ze worden niet automatisch meegenomen naar Vercel.

## Nog niet publiceren

Lokaal gebruiken we SQLite. Voor Vercel moet de accountdatabase in Turso staan. Stel daarvoor later `TURSO_DATABASE_URL` en `TURSO_AUTH_TOKEN` in bij Vercel en maak het eerste medewerkeraccount in die database aan. Het pakket weigert een lokale database op Vercel.

Je bestaande Supabase-koppelingen blijven alleen voor de bestaande websitegegevens, zoals Furniture en rendementsprojecten. De nieuwe persoonlijke accounts gebruiken Supabase niet.

Bestaande rendementslinks werken voortaan pas na inloggen met toegang tot **Rendementscheck Spanje**. Een bewerklink of de instelling `internal=1` geeft een externe gebruiker geen schrijfrechten. Toegang tot dit onderdeel geeft kijkrechten op de opgeslagen rendementsprojecten van dat onderdeel. De rechten voor Los Naranjos en La Carolina gelden voor de losse rapporten; die geven geen toegang tot de rendementscheck.

De website gebruikt nog gepubliceerde Google Sheets-bronnen. De nieuwe login maakt die rechtstreeks gepubliceerde bronnen niet privé. Voordat je vertrouwelijke gegevens deelt, moeten die bronnen zelf privé worden gemaakt en via een geauthenticeerde serverkoppeling worden opgehaald. Dat vraagt toegang tot de broninstellingen en is hier niet gewijzigd.

Foto's en QA-bestanden uit je bestaande `public`-map blijven behouden. De bekende foto-URL's worden op rechten gecontroleerd. De anonieme Next.js image optimizer is uitgeschakeld; je bestaande gewone afbeeldingen blijven werken. Ontbrekende afbeeldingen in deze zip komen doordat `public` bewust niet is meegestuurd.

Bij de Nederlandse portefeuille ontvangt de browser alleen Nederlandse objecten en Nederlandse financieringsregels. Het algemene financiële overzicht, dat ook andere landen bevat, wordt op die pagina niet meer meegestuurd.

## Controles

Zie `VERIFICATIE.md` voor de uitgevoerde controles en de grenzen daarvan.
