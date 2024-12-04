import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import jsforce from 'jsforce';
import cors from 'cors';
import {CHILD_WHERE_CLAUSE, DEFAULT_PRODUCT_QUERY, PARENT_WHERE_CLAUSE} from './products/query';

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

// app.post('/download-image', async (req, res) => {

//     const imageUrl = req.body.URL_image__c;
//     const reference = req.body.Reference__c;
//     if (!imageUrl) {
//         return res.status(404).json({ message: 'Pas d\'image pour ce produit' });
//     }

//     try {
//         console.info("📝 BODY DU REQ", imageUrl, reference);

//         // Si pas de token d'accès, on se connecte à Salesforce
//         if (!conn.accessToken) {
//             await conn.login(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);
//         }

//         // On fait la requête fetch pour récupérer l'image
//         const response = await fetch(imageUrl, {
//             headers: {
//                 'Authorization': `Bearer ${conn.accessToken}`,
//                 'Cookie': `sid=${conn.accessToken}`
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`Erreur HTTP: ${response.status}`);
//         }

//         // Définition du chemin où on va sauvegarder l'image téléchargée
//         const filePath = path.join(__dirname, '..', 'upload', `${reference}.webp`);
//         const fileStream = fs.createWriteStream(filePath);

//         // Téléchargement de l'image et sauvegarde sur disque
//         const imageStream = Readable.from(response.body);
//         await new Promise((resolve, reject) => {
//             imageStream
//                 .pipe(fileStream)
//                 .on('finish', () => {
//                     console.log('Image téléchargée avec succès:', filePath);

//                     // Lecture du fichier pour le convertir en Base64
//                     const base64Image =  fs.readFileSync(filePath, { encoding: 'base64' });

//                     // Envoi de la réponse avec le chemin de l'image et sa version en Base64
//                     return res.status(200).json({
//                         message: 'Image téléchargée avec succès',
//                         base64: `data:image/webp;base64,${base64Image}`
//                     });
                
//                 })
//                 .on('error', (error) => {
//                     reject(error);
//                 });
//         });

//     } catch (error) {
//         console.error('Erreur lors de la récupération de l\'image:', error);
//         res.status(500).send(error.message);
//     }
// });

app.post('/download-image', async (req, res) => {

    const imageUrl = req.body.URL_image__c;
    const reference = req.body.Reference__c;
    if (!imageUrl) {
        return res.status(404).json({ message: 'Pas d\'image pour ce produit' });
    }

    try {
        console.info("📝 BODY DU REQ", imageUrl, reference);

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
