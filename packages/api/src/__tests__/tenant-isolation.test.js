import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

describe('Tenant Isolation', () => {
  let tenantAAdmin, tenantBAdmin, tenantAToken, tenantBToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flowbit-test');
    
    // Create test users
    tenantAAdmin = new User({
      email: 'admin-a@test.com',
      password: 'password123',
      role: 'Admin',
      customerId: 'tenant-a',
      tenantName: 'TenantA'
    });
    await tenantAAdmin.save();

    tenantBAdmin = new User({
      email: 'admin-b@test.com',
      password: 'password123',
      role: 'Admin',
      customerId: 'tenant-b',
      tenantName: 'TenantB'
    });
    await tenantBAdmin.save();

    // Generate tokens
    tenantAToken = jwt.sign(
      { id: tenantAAdmin._id, customerId: 'tenant-a', role: 'Admin' },
      process.env.JWT_SECRET || 'test-secret'
    );

    tenantBToken = jwt.sign(
      { id: tenantBAdmin._id, customerId: 'tenant-b', role: 'Admin' },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await mongoose.connection.close();
  });

  test('Admin from Tenant A cannot read Tenant B data', async () => {
    // Create a ticket for Tenant B
    const tenantBTicket = new Ticket({
      title: 'Tenant B Ticket',
      description: 'This belongs to Tenant B',
      customerId: 'tenant-b',
      createdBy: tenantBAdmin._id
    });
    await tenantBTicket.save();

    // Try to access Tenant B's tickets with Tenant A's token
    const response = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(0); // Should not see Tenant B's ticket
  });

  test('Admin from Tenant A can only see their own tenant data', async () => {
    // Create a ticket for Tenant A
    const tenantATicket = new Ticket({
      title: 'Tenant A Ticket',
      description: 'This belongs to Tenant A',
      customerId: 'tenant-a',
      createdBy: tenantAAdmin._id
    });
    await tenantATicket.save();

    // Access Tenant A's tickets with Tenant A's token
    const response = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(1);
    expect(response.body.tickets[0].customerId).toBe('tenant-a');
    expect(response.body.tickets[0].title).toBe('Tenant A Ticket');
  });
});