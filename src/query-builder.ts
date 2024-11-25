const queryBuilder = (table: string, where: string, select: string[]) => {
    let query = `
        SELECT ${select.join(', ')}
        FROM ${table}
        WHERE ${where}
    `
	return query
}


class QueryBuilder {
    private query: string

    constructor(table: string, where: string, select: string[]) {
        this.query = queryBuilder(table, where, select)
    }

	andWhere(where: string) {
		this.query += ` AND ${where}`
		return this
	}

	orWhere(where: string) {
		this.query += ` OR ${where}`
		return this
	}

	orderBy(orderBy: string, order: 'ASC' | 'DESC' = 'ASC') {
		this.query += ` ORDER BY ${orderBy} ${order}`
		return this
	}

	limit(limit: number) {
		this.query += ` LIMIT ${limit}`
		return this
	}

	getQuery() {
		return this.query
	}
}

export default QueryBuilder
