import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import jsforce from 'jsforce';
import cors from 'cors';
import {CHILD_WHERE_CLAUSE, DEFAULT_PRODUCT_QUERY, PARENT_WHERE_CLAUSE} from './products/query';

const app = express();
const port = 3000;

dotenv.config();

app.use(express.json());

// Configuration de CORS
const corsOptions = {
	origin: /^http:\/\/localhost(:\d+)?$/, // Autorise tous les ports pour localhost/
	// origin: "http://192.168.1.122:5173/", // Autorise tous les ports pour localhost
	// origin: "http://192.168.1.109:5173/",
	optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


// Configuration de la connexion Salesforce
const conn = new jsforce.Connection({
	loginUrl: process.env.SALESFORCE_LOGIN_URL,
});

// Route de connexion à Salesforce
app.post('/login', async (req: Request, res: Response) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ erreur: 'Nom d\'utilisateur et mot de passe requis' });
	}

	try {
		await conn.login(username, password);
		res.json({ message: 'Connexion réussie' });
	} catch (erreur) {
		console.error('Erreur de connexion à Salesforce:', erreur);
		res.status(401).json({ erreur: 'Échec de l\'authentification' });
	}
});


app.get('/salesforce-data/parent', async (req: Request, res: Response) => {
	try {
		await conn.login(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);//login with .env
		const {lastRecordID,lastSync} = req.query
		const recordsPerPage = 500;

		let query = DEFAULT_PRODUCT_QUERY;

		if (lastRecordID) {
			query += ` AND Numero_inc__c > '${lastRecordID}'`;
		}

		if(lastSync) {
			query += ` AND LastModifiedDate > ${lastSync}`
		}

		query += PARENT_WHERE_CLAUSE

		query += ` ORDER BY Numero_inc__c ASC LIMIT ${recordsPerPage}`;


		const result = await conn.query(query);
		console.log("🚀 ~ app.get ~ result:",lastSync, result.records.length)

		const lastRecord = result.records[result.records.length - 1];
		const newLastRecordID = lastRecord ? lastRecord.Numero_inc__c : null;
		console.log("🚀 ~ app.get ~ newLastRecordID:", newLastRecordID)

		return res.json({
			records: result.records,
			lastRecordID: newLastRecordID,
			hasMore: result.records.length === recordsPerPage
		});
	} catch (error) {
		console.error('Erreur lors de la requête Salesforce:', error);
		res.status(500).json({ error: 'Erreur lors de la récupération des données Salesforce' });
	}
});

app.get('/salesforce-data/child', async (req: Request, res: Response) => {
	try {
		await conn.login(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);
		const {lastRecordID,lastSync} = req.query
		const recordsPerPage = 500;

		let query = DEFAULT_PRODUCT_QUERY;

		if (lastRecordID) {
			query += ` AND Numero_inc__c > '${lastRecordID}'`;
		}

		if(lastSync) {
			query += ` AND LastModifiedDate > ${lastSync}`
		}

		query += CHILD_WHERE_CLAUSE

		query += ` ORDER BY Numero_inc__c ASC LIMIT ${recordsPerPage}`;


		const result = await conn.query(query);
		console.log("🚀 ~ app.get ~ result:",lastSync, result.records.length)

		const lastRecord = result.records[result.records.length - 1];
		const newLastRecordID = lastRecord ? lastRecord.Numero_inc__c : null;
		console.log("🚀 ~ app.get ~ newLastRecordID:", newLastRecordID)

		return res.json({
			records: result.records,
			lastRecordID: newLastRecordID,
			hasMore: result.records.length === recordsPerPage
		});
	} catch (error) {
		console.error('Erreur lors de la requête Salesforce:', error);
		res.status(500).json({ error: 'Erreur lors de la récupération des données Salesforce' });
	}
});

//TODO/ LE PROBLEME C'EST LES CORS
app.get('/download-image', async (req, res) => {
    const imageUrl = 'https://gdcomgroup--catsplayce.sandbox.file.force.com/sfc/servlet.shepherd/version/download/068AW000007ufR3YAI';
    await conn.login(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);
    try {
        const response = await fetch(imageUrl);
		console.log(response)
        // console.log("🚀 ~ app.get ~ imageUrl:", imageUrl)

        if (!response.ok) {
            return res.status(500).send('Erreur de récupération de l\'image');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', 'image/webp');
        res.send(buffer);
    } catch (error) {
        console.error('Erreur côté serveur:', error);
        res.status(500).send('Erreur interne du serveur');
    }
});


app.listen(port, () => {
	console.log(`Serveur en écoute sur le port ${port}`);
	console.log('process.env.NODE_ENV', process.env.NODE_ENV)
	console.log('process.env.SALESFORCE_LOGIN_URL', process.env.SALESFORCE_LOGIN_URL)
});
