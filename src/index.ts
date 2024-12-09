import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import jsforce from 'jsforce';
import cors from 'cors';
import {CHILD_WHERE_CLAUSE, DEFAULT_PRODUCT_QUERY, PARENT_WHERE_CLAUSE, DEFAULT_CATEGORY_QUERY} from './products/query';

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Readable } = require('stream');

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
	(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);//login with .env
	// const { username, password } = req.body;

	// if (!username || !password) {
	// 	return res.status(400).json({ erreur: 'Nom d\'utilisateur et mot de passe requis' });
	// }

	try {
		await conn.login(username, password);
		res.json({ message: 'Connexion réussie' });
	} catch (erreur) {
		console.error('Erreur de connexion à Salesforce:', erreur);
		res.status(401).json({ erreur: 'Échec de l\'authentification' });
	}
});

app.get('/salesforce-data/category', async (req: Request, res: Response) => {
	try {
		await conn.login(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);
		let query = DEFAULT_CATEGORY_QUERY;
		const result = await conn.query(query);
		return res.json({
			record: result.records
		})
	//Actuellement la requête est limitée à 500 résultats par SF sur la sandbox. 2000 en prod, si trop long rajouter un id incrémental dans la table
	} catch (error) {
		console.error('Erreur lors de la requête Salesforce:', error);
		res.status(500).json({ error: 'Erreur lors de la récupération des données Salesforce' });
	}
})

app.get('/salesforce-data/parent', async (req: Request, res: Response) => {
	try {
		console.log(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!)
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

app.post('/download-image', async (req, res) => {
	let reference = ""
    const imageUrl = req.body.URL_image__c;
	if (req.body.Reference__c) {
		reference = req.body.Reference__c;
	}
	else if (req.body.Id) {
		reference = req.body.Id
	}
  
    if (!imageUrl) {
        return res.status(404).json({ message: 'Pas d\'image pour ce produit' });
    }

    try {
        if (!conn.accessToken) {
            await conn.login(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);
        }

        const response = await fetch(imageUrl, {
            headers: {
                'Authorization': `Bearer ${conn.accessToken}`,
                'Cookie': `sid=${conn.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const filePath = path.join(__dirname, '..', 'upload', `${reference}.webp`);
        const fileStream = fs.createWriteStream(filePath);
        const imageStream = Readable.from(response.body);
        imageStream.pipe(fileStream);

        fileStream.on('finish', () => {
            console.log('Image téléchargée avec succès:', filePath);

            try {
                const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });

                return res.status(200).json({
                    message: 'Image téléchargée avec succès',
                    base64: `data:image/webp;base64,${base64Image}`
                });
            } catch (error) {
                console.error('Erreur lors de la lecture du fichier:', error);
                return res.status(500).json({ message: 'Erreur lors de la conversion en Base64', error: error.message });
            }
        });

        fileStream.on('error', (error: any) => {
            console.error('Erreur lors du téléchargement de l\'image:', error);
            return res.status(500).json({ message: 'Erreur lors du téléchargement de l\'image', error: error.message });
        });

    } catch (error) {
        console.error('Erreur générale:', error);
        return res.status(500).json({ message: 'Erreur lors du traitement de l\'image', error: error.message });
    }
});



app.listen(port, () => {
	console.log(`Serveur en écoute sur le port ${port}`);
	console.log('process.env.NODE_ENV', process.env.NODE_ENV)
	console.log('process.env.SALESFORCE_LOGIN_URL', process.env.SALESFORCE_LOGIN_URL)
});
