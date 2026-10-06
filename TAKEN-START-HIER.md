# Takensysteem installeren

Dit is een update voor jouw aangeleverde Cursor-project. Het pakket bevat alleen nieuwe en gewijzigde bestanden. Je bestaande pagina's en foto's blijven in je project staan.

## Overnemen in Cursor

1. Maak eerst een commit van je huidige project als herstelpunt.
2. Pak `takensysteem-update.zip` uit.
3. Kopieer de inhoud naar de hoofdmap van je bestaande project, waar `package.json` staat. Voeg de mappen samen en vervang de overeenkomende bestanden. Verwijder geen bestaande mappen.
4. Voer in de terminal `npm install` en `npm run build` uit. Je bestaande `.env.local` blijft nodig voor lokaal testen. Deze zip bevat geen wachtwoorden, tokens of databasekopieën.
5. Test lokaal met `npm start`. Commit en push daarna naar je gewone GitHub-branch om via Vercel te publiceren.

Er zijn geen nieuwe omgevingsvariabelen nodig. Taken, projecten, opmerkingen en bijlagen gebruiken de bestaande Turso-database. De nieuwe tabellen worden bij het eerste gebruik automatisch toegevoegd; bestaande accounts blijven behouden.

## Don instellen

Ga na installatie naar **Gebruikers beheren → Don → Gegevens en toegang bewerken**. Vink **Teamoverzicht voor taken op de homepage** aan en sla op. Don moet daarna opnieuw inloggen.

Dit gebeurt bewust niet automatisch op basis van alleen een naam: zo kies je zijn juiste bestaande account. Andere medewerkers krijgen standaard hun eigen taken. Iedereen kan op de takenpagina alle medewerkerstaken bekijken, toewijzen en aanpassen.

## Gebruik

- Het takenblok staat onder de bestaande tegels. Standaard verschijnen drie open taken, op deadline gesorteerd. Met Meer tonen zie je maximaal tien. Minder tonen maakt het weer compact.
- Alle taken bekijken opent `/taken`. Daar filter je op project, collega, status en zoektekst. Don begint met alle collega's geselecteerd; anderen beginnen met hun eigen taken.
- + Taak toevoegen: kies een project en één verantwoordelijke, vul de taak en deadline in en voeg checklistpunten toe. Sla op.
- Open de opgeslagen taak opnieuw om opmerkingen en bijlagen toe te voegen. Bijlagen en opmerkingen worden meteen bewaard; wijzigingen aan de taak en checklist bewaar je met Taak opslaan.
- Screenshots: PNG, JPEG of WebP. Documenten: PDF. Maximaal 3 MB per bestand en tien bijlagen per taak. Bestanden worden privé opgeslagen en alleen voor ingelogde medewerkers aangeboden. Ze tellen mee voor je Turso-opslag.
- Maak een taak Klaar om hem uit de open lijst te halen. Afgeronde taken blijven via het statusfilter terug te vinden.
- Bij gelijktijdig bewerken wordt een verouderde wijziging geweigerd. Vernieuw de lijst om de nieuwste versie te zien; niet opgeslagen invoer gaat bij vernieuwen verloren.

## Projecten selecteren voor het takenmenu

Klik op de takenpagina op **Projecten beheren**. Zoek een project op naam, adres of land en vink aan welke projecten zichtbaar moeten zijn. Klik daarna op **Projectselectie opslaan**. Deze selectie geldt voor alle medewerkers.

Met **Alleen Marketing en Algemeen** maak je eerst een korte lijst; vink vervolgens de vastgoedprojecten aan die jullie echt gebruiken. Marketing en Algemeen kunnen niet verborgen worden. Archiefprojecten staan niet in het takenmenu en ook niet in Projecten beheren. Bestaande taken blijven beschikbaar; bij het bewerken van zo’n taak blijft het gekoppelde project herkenbaar.

Verborgen projecten en bestaande taken worden niet verwijderd. De taken blijven op de homepage en bij **Alle projecten** zichtbaar. Je kunt een bestaande taak blijven aanpassen en het project later weer zichtbaar maken. Bij een nieuwe taak kun je alleen een zichtbaar, actief project kiezen. Opnieuw ophalen van de portefeuille bewaart je gemaakte selectie.

## Projecten

Bij het openen van de takenpagina worden projecten uit Complete portefeuille opgehaald. Ook Marketing en Algemeen zijn beschikbaar. De knop Portefeuille bijwerken haalt de actuele lijst opnieuw op. De portefeuille zelf wordt niet gewijzigd.

De naam, het land, adres en de status van portefeuilleprojecten komen uit dezelfde CSV-bron als je bestaande pagina. Alleen lokale browserbewerkingen op Complete portefeuille komen niet mee. Verkochte projecten worden als archief gemarkeerd en verdwijnen uit het takenmenu en Projecten beheren; bestaande taken blijven beschikbaar.

Voeg andere projecten toe met + Project toevoegen. Je kunt naam, land, adres, status en omschrijving vastleggen. Kies een project in het menu en gebruik Project bekijken om de gegevens te openen. Zelf toegevoegde projecten kun je daar aanpassen en archiveren.

Als de CSV tijdelijk niet beschikbaar is, blijven bestaande taken en projecten bruikbaar. Opnieuw ophalen gebeurt wanneer je de takenpagina opent of Portefeuille bijwerken kiest. Eerdere projecten worden behouden zodat bestaande taken hun koppeling houden. Een ingrijpende adreswijziging in de bron kan als een nieuw project worden gezien.

## Controle en grenzen van deze versie

Tests controleren accountrechten, het teamoverzicht, opslaan en gelijktijdig wijzigen, projectgegevens, opmerkingen, checklist, privébijlagen en het koppelen van portefeuilleprojecten. TypeScript en lintcontroles van de gewijzigde code slagen. De productiebuild is lokaal gecontroleerd; hiervoor was alleen in deze afgeschermde omgeving een tijdelijke omweg voor Node-geheugenmetingen nodig. Die zit niet in het pakket.

Er wordt getest met een aparte lokale database en voorbeeldgegevens. Jouw productie-Turso is niet gelezen of gewijzigd. De opslag met je echte Turso-account moet na installatie ook worden getest. Er is niets gepusht of gepubliceerd.

Meldingen zijn nog niet ingebouwd. De eerdere losse update voor automatische rendementsprojecttegels is niet toegevoegd; deze update vertrekt van je nieuwste aangeleverde zip.
