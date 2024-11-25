# Liens utiles

### Documentation SOQL (Salesforce Object Query Language)

 Pour comprendre et utiliser efficacement les requêtes SOQL dans Salesforce, voici le lien vers la documentation officielle :

[Documentation SOQL](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_select.htm)

Cette documentation détaille la syntaxe et les fonctionnalités des requêtes SOQL, essentielles pour interagir avec l'API Salesforce. Elle couvre les aspects suivants :

- Structure de base d'une requête SOQL
- Sélection de champs
- Filtrage des résultats
- Tri et limitation des résultats
- Jointures et relations entre objets
- Fonctions d'agrégation

Consultez cette ressource pour maîtriser les requêtes SOQL et optimiser vos interactions avec la base de données Salesforce.
###
---
### Workbench Salesforce

Pour tester et développer vos requêtes SOQL de manière interactive, vous pouvez utiliser Workbench, un outil en ligne fourni par Salesforce :

[Workbench Salesforce](https://workbench.developerforce.com/login.php)

Workbench offre les fonctionnalités suivantes :

- Exécution de requêtes SOQL et SOSL
- Visualisation et manipulation des données Salesforce
- Test des appels API REST et SOAP
- Exploration de la structure des objets Salesforce

Cet outil est particulièrement utile pour :

- Vérifier la syntaxe de vos requêtes SOQL
- Explorer les données de votre organisation Salesforce
- Tester et déboguer vos intégrations

N'oubliez pas de vous connecter avec vos identifiants Salesforce pour accéder à votre organisation spécifique.
###
---
### Documentation JSForce

Pour utiliser efficacement JSForce, la bibliothèque Node.js pour interagir avec l'API Salesforce, voici le lien vers la documentation officielle :

[Documentation JSForce](https://jsforce.github.io/document/#using-soql)

Cette documentation est essentielle pour comprendre comment utiliser JSForce dans votre application Node.js. Elle couvre notamment :

- L'utilisation des requêtes SOQL avec JSForce
- La manipulation des objets Salesforce
- L'exécution d'opérations CRUD (Create, Read, Update, Delete)
- La gestion des relations entre objets
- L'utilisation des fonctions d'agrégation

Points clés à retenir :

- JSForce simplifie l'interaction avec l'API Salesforce en fournissant une interface JavaScript intuitive
- Il permet d'exécuter des requêtes SOQL de manière asynchrone
- La bibliothèque gère automatiquement la pagination des résultats pour les requêtes volumineuses

Consultez cette documentation pour optimiser votre utilisation de JSForce et tirer pleinement parti de ses fonctionnalités dans votre projet.

###
---
### Limite de décalage SOQL et solution de contournement

Lors de l'utilisation de requêtes SOQL dans Salesforce, il existe une limite importante à connaître : le décalage (offset) maximal est de 2000 enregistrements. Cela signifie que vous ne pouvez pas utiliser la clause OFFSET pour récupérer des enregistrements au-delà de la 2000ème position dans vos résultats.

Problème :
- La clause OFFSET dans SOQL est limitée à 2000 enregistrements.
- Cette limitation peut poser problème lors de la pagination ou de la récupération de grands volumes de données.

Solution de contournement :
Pour surmonter cette limitation, vous pouvez utiliser une approche basée sur le tri et le filtrage. Voici les étapes à suivre :

1. Triez vos résultats par un champ unique et ordonné (par exemple, CreatedDate ou un champ d'ID auto-incrémenté).
2. Utilisez la valeur du dernier enregistrement récupéré comme point de départ pour la requête suivante.

Exemple simple avec JSForce :
```javascript	
// Exemple simple avec JSForce :
app.get('/mon-end-point', async (req, res) => {

	let derniereDateCreation = req.query.lastCreatedDate // string
	// doit être infereieur ou égale a 2000
	const resultPerPage = 2000;
		// requete de base
	let query = `
        SELECT Id, Name, CreatedDate
        FROM Account
        WHERE monChamps = 'valeur1' AND monAutreChamps = 'valeur2'
    `
	// ajouter la date de création du dernier objet pour la pagination si existant (donc rien pour page 1)
	if(derniereDateCreation) {
		query += `AND CreatedDate > ${derniereDateCreation}`
	}

	// ordorner les resultat avec la clef CreatedDate
	let query += `
		ORDER BY CreatedDate ASC
        LIMIT ${resultPerPage}
	`

	// executer la requete
	const result = await conn.query(query);

	// recuperer la derniere ligne
	const lastRecord = result.records[result.records.length - 1];
	// définir la prochaine page
	const nextPageDate = lastRecord ? lastRecord.CreatedDate : null;

	// renvoyer les données
	res.json({
		records: result.records,
		nextPageDate: nextPageDate,
		currentPage: page,
		hasMore: result.records.length === recordsPerPage
	});
}) 
```
###
---
# Environnement de développement vs production :

Lors du développement d'applications utilisant Salesforce, il est crucial de distinguer l'environnement de développement de l'environnement de production. Voici quelques points importants à considérer :

1. URLs de connexion différentes :
   - Développement : https://test.salesforce.com
   - Production : https://login.salesforce.com

2. Gestion des variables d'environnement :
   Utilisez des fichiers .env distincts pour chaque environnement. Par exemple :

   .env (développement) :
   ```
   SALESFORCE_LOGIN_URL="https://test.salesforce.com"
   ```

   .env.prod (production) :
   ```
   SALESFORCE_LOGIN_URL="https://login.salesforce.com"
   ```

3. Configuration de l'application :
   Assurez-vous que votre application charge le bon fichier .env en fonction de l'environnement :

   ```javascript
	import dotenv from 'dotenv';

	const conn = new jsforce.Connection({
		loginUrl: process.env.SALESFORCE_LOGIN_URL,
	});
   ```

4. Sandbox manipuler les données: 
	- [Sandbox salesforce](https://gdcomgroup--catsplayce.sandbox.lightning.force.com/lightning/page/home) : jeux de donnée manipulable sans risque

###
---
# Référence projet: 

1. Maquette:
	- [Lien figma](https://www.figma.com/design/ErgHIuiGdxXog01I1DjN7j/SPLAYCE?node-id=12-595&node-type=frame&t=LxtCh6Efz66CidfV-0)







