/**
 * Backend Tests — Unit + Integration
 * Tools: Jest + Supertest
 */

const request = require('supertest');
const app = require('../src/app');

// ─── Unit Tests ───────────────────────────────────────────────────────────────
describe('Unit: health payload shape', () => {
    it('has correct fields', () => {
        const payload = { status: 'ok', message: 'ShopSmart Backend is running', timestamp: new Date().toISOString() };
        expect(payload).toHaveProperty('status', 'ok');
        expect(payload).toHaveProperty('message');
        expect(typeof payload.timestamp).toBe('string');
    });

    it('timestamp is a valid ISO string', () => {
        const ts = new Date().toISOString();
        expect(new Date(ts).toISOString()).toBe(ts);
    });
});

// ─── Integration: health ──────────────────────────────────────────────────────
describe('Integration: GET /api/health', () => {
    it('responds 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
    });
    it('body.status is ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body.status).toBe('ok');
    });
});

// ─── Integration: products ────────────────────────────────────────────────────
describe('Integration: GET /api/products', () => {
    it('returns 200 and a products array', async () => {
        const res = await request(app).get('/api/products');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('returns all 8 products', async () => {
        const res = await request(app).get('/api/products');
        expect(res.body.products.length).toBe(8);
    });

    it('filters by category', async () => {
        const res = await request(app).get('/api/products?category=Electronics');
        expect(res.statusCode).toBe(200);
        res.body.products.forEach(p => {
            expect(p.category).toBe('Electronics');
        });
    });

    it('returns 404 for unknown single product', async () => {
        const res = await request(app).get('/api/products/9999');
        expect(res.statusCode).toBe(404);
    });

    it('returns a single product by id', async () => {
        const res = await request(app).get('/api/products/1');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('price');
    });
});

// ─── Integration: categories ──────────────────────────────────────────────────
describe('Integration: GET /api/categories', () => {
    it('returns categories array', async () => {
        const res = await request(app).get('/api/categories');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('includes Electronics', async () => {
        const res = await request(app).get('/api/categories');
        expect(res.body.categories).toContain('Electronics');
    });
});

// ─── Integration: cart ────────────────────────────────────────────────────────
describe('Integration: Cart API', () => {
    it('GET /api/cart returns empty cart initially', async () => {
        // Clear cart first
        await request(app).delete('/api/cart');
        const res = await request(app).get('/api/cart');
        expect(res.statusCode).toBe(200);
        expect(res.body.items).toHaveLength(0);
        expect(res.body.total).toBe(0);
    });

    it('POST /api/cart adds product to cart', async () => {
        await request(app).delete('/api/cart');
        const res = await request(app)
            .post('/api/cart')
            .send({ productId: 1, quantity: 1 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('productId');
    });

    it('GET /api/cart shows added item', async () => {
        await request(app).delete('/api/cart');
        await request(app).post('/api/cart').send({ productId: 2, quantity: 1 });
        const res = await request(app).get('/api/cart');
        expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('DELETE /api/cart/:id removes the item', async () => {
        await request(app).delete('/api/cart');
        await request(app).post('/api/cart').send({ productId: 3 });
        const del = await request(app).delete('/api/cart/3');
        expect(del.statusCode).toBe(200);
    });

    it('DELETE /api/cart clears entire cart', async () => {
        await request(app).post('/api/cart').send({ productId: 4 });
        await request(app).delete('/api/cart');
        const res = await request(app).get('/api/cart');
        expect(res.body.items).toHaveLength(0);
    });

    it('POST /api/cart with invalid productId returns 400', async () => {
        const res = await request(app).post('/api/cart').send({});
        expect(res.statusCode).toBe(400);
    });
});

// ─── Integration: 404 ────────────────────────────────────────────────────────
describe('Integration: unknown routes', () => {
    it('returns 404', async () => {
        const res = await request(app).get('/api/doesnotexist');
        expect(res.statusCode).toBe(404);
    });
});
