export const RECORD_TYPE = {
	PARENT: '01209000000mcl5AAA',
	CHILD: '01209000000mcl4AAA'
} as const;

export const DEFAULT_PRODUCT_QUERY =  `
	SELECT
		IsActive,
		Numero_inc__c,
		Entit_GD__c,
		Family,
		ProductCode,
		Type__c,
		Couleurs_du_produit__c,
		Description,
		SubFamilyMktg__c,
		SubFamilyMktg2__c,
		Reference__c,
		SumEcoscore__c,
		Ecoscore__c,
		Ecoscore2__c,
		Ecoscore3__c,
		Ecoscore4__c,
		Ecoscore5__c,
		Name,
		Stock_dispo__c,
		Default_Price__c,
		CreatedDate,
		LastModifiedDate,
		Material__c,
		Dimensions__c,
		Id,
		Image_HTML__c,
		Origine_impression__c,
		Origine_production__c,
		SpecificInformation__c,
		TechnicalDescription__c,
		IsDisplay_on_shop__c,
		Parent_ProductRef__c,
		RecordTypeId,
		Etat_Silog__c,
		URL_image__c,
		Famille_Catalogue__c,
		Nb_pi_ces_par_colis__c,
		Poids_brut__c
	FROM Product2
	WHERE Entit_GD__c INCLUDES ('splayce') 
	`;
	// AND IsActive = true

	// export const DEFAULT_PRODUCT_QUERY =  `
 	// SELECT
 	// *
 	// FROM Product2
 	// WHERE Entit_GD__c INCLUDES ('splayce') 
 	// `;

export const PARENT_WHERE_CLAUSE = `
	AND (NOT Etat_Silog__c LIKE '%Arrêté%')
	AND RecordTypeId = '${RECORD_TYPE.PARENT}'
`

export const CHILD_WHERE_CLAUSE = `
	AND IsActive = true
	AND RecordTypeId = '${RECORD_TYPE.CHILD}'
`

//TODO/ Ajouter une clause WHERE IsDeleted (...)
export const DEFAULT_CATEGORY_QUERY = `
SELECT 
	Id,
	URL_image__c,
	Name,
	IsDeleted
FROM Famille_Catalogue__c
`

