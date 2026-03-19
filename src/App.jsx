
import React, { useState, useEffect, useCallback } from 'react';

// --- I. Data Model, Configuration, and Seed Data ---

// 1. ROLES Configuration for RBAC
const ROLES = {
  CLAIMANT: 'Claimant',
  CALL_CENTER_AGENT: 'Call Center Agent',
  INTAKE_SPECIALIST: 'Intake Specialist',
  CLAIMS_EXAMINER: 'Claims Examiner',
  SENIOR_ADJUDICATOR: 'Senior Claims Adjudicator',
  MEDICAL_LEGAL_COMPLIANCE: 'Medical/Legal/Compliance Reviewer',
  UNDERWRITING_VALIDATION: 'Underwriting/Policy Validation Specialist',
  SUPERVISOR: 'Supervisor/Team Lead',
  FINANCE: 'Finance/Disbursement Officer',
  DOCUMENT_VERIFIER: 'Document Verification Specialist',
  OPERATIONS_ADMIN: 'Operations Admin',
  EXECUTIVE: 'Executive/Business Leader',
};

// Map role to default dashboard view
const ROLE_DASHBOARD_MAP = {
  [ROLES.EXECUTIVE]: 'EXECUTIVE_DASHBOARD',
  [ROLES.SUPERVISOR]: 'SUPERVISOR_DASHBOARD',
  [ROLES.CLAIMS_EXAMINER]: 'EXAMINER_DASHBOARD',
  [ROLES.INTAKE_SPECIALIST]: 'INTAKE_DASHBOARD',
  [ROLES.FINANCE]: 'FINANCE_DASHBOARD',
  [ROLES.MEDICAL_LEGAL_COMPLIANCE]: 'COMPLIANCE_FRAUD_DASHBOARD',
  [ROLES.OPERATIONS_ADMIN]: 'ADMIN_DASHBOARD',
  [ROLES.DOCUMENT_VERIFIER]: 'DOCUMENT_DASHBOARD',
  // Default for others
  [ROLES.CALL_CENTER_AGENT]: 'INTAKE_DASHBOARD',
  [ROLES.CLAIMANT]: 'CLAIMANT_DASHBOARD',
  [ROLES.SENIOR_ADJUDICATOR]: 'SUPERVISOR_DASHBOARD', // Can see a broader view than examiner
  [ROLES.UNDERWRITING_VALIDATION]: 'EXAMINER_DASHBOARD', // Similar view needs, perhaps a specialized queue
};

// 2. Claims Statuses and their properties
const CLAIMS_STATUSES = {
  NEW: { label: 'New', colorClass: 'in-progress' },
  INTAKE_REVIEW: { label: 'Intake Review', colorClass: 'in-progress' },
  DOCS_PENDING: { label: 'Documents Pending', colorClass: 'pending' },
  VALIDATION_IN_PROGRESS: { label: 'Validation In Progress', colorClass: 'in-progress' },
  EXAMINER_REVIEW: { label: 'Examiner Review', colorClass: 'in-progress' },
  PENDING_ADD_INFO: { label: 'Pending Add. Info', colorClass: 'pending' },
  MEDICAL_REVIEW: { label: 'Medical Review', colorClass: 'in-progress' },
  LEGAL_REVIEW: { label: 'Legal Review', colorClass: 'in-progress' },
  COMPLIANCE_REVIEW: { label: 'Compliance Review', colorClass: 'in-progress' },
  PENDING_ADJUDICATION: { label: 'Pending Adjudication', colorClass: 'pending' },
  ADJUDICATION_COMPLETE: { label: 'Adjudication Complete', colorClass: 'in-progress' },
  PENDING_APPROVAL_1: { label: 'Pending Level 1 Approval', colorClass: 'pending' },
  PENDING_APPROVAL_2: { label: 'Pending Level 2 Approval', colorClass: 'pending' },
  PENDING_APPROVAL_3: { label: 'Pending Level 3 Approval', colorClass: 'pending' },
  PENDING_FINANCE_APPROVAL: { label: 'Pending Finance Approval', colorClass: 'pending' },
  APPROVED: { label: 'Approved', colorClass: 'approved' },
  PAYOUT_PROCESSING: { label: 'Payout Processing', colorClass: 'in-progress' },
  PAYOUT_COMPLETE: { label: 'Payout Complete', colorClass: 'approved' },
  REJECTED: { label: 'Rejected', colorClass: 'rejected' },
  CLOSED: { label: 'Closed', colorClass: 'approved' },
  EXCEPTION: { label: 'Exception', colorClass: 'exception' },
  ON_HOLD: { label: 'On Hold', colorClass: 'pending' },
  APPEALED: { label: 'Appealed', colorClass: 'exception' },
};

// 3. Sample User Data (for RBAC)
const USER_DATA = {
  id: 'user123',
  name: 'Alice Johnson',
  email: 'alice.johnson@example.com',
  role: ROLES.SUPERVISOR, // Change this to test different roles
  // role: ROLES.CLAIMS_EXAMINER,
  // role: ROLES.EXECUTIVE,
  // role: ROLES.FINANCE,
  // role: ROLES.INTAKE_SPECIALIST,
  // role: ROLES.OPERATIONS_ADMIN,
};

// 4. Sample Claims Data (Seed Data)
const CLAIMS_DATA = [
  {
    id: 'L001-2023-001',
    type: 'Life death claim',
    policyNumber: 'LP87654321',
    insured: 'John Doe',
    claimant: 'Jane Doe',
    status: CLAIMS_STATUSES.PENDING_APPROVAL_2,
    amount: 500000,
    submissionDate: '2023-01-15',
    lastUpdate: '2023-03-01',
    assignedTo: 'Bob Claims',
    riskScore: 'High',
    slaStatus: 'Approaching Breach',
    documents: [
      { id: 'doc1', name: 'Death Certificate.pdf', status: 'Accepted', category: 'Mandatory' },
      { id: 'doc2', name: 'Claimant ID.pdf', status: 'Pending Verification', category: 'Mandatory' },
    ],
    milestones: [
      { name: 'Intake', date: '2023-01-15', status: 'completed' },
      { name: 'Validation', date: '2023-01-20', status: 'completed' },
      { name: 'Examiner Review', date: '2023-02-10', status: 'completed' },
      { name: 'Adjudication', date: '2023-02-25', status: 'completed' },
      { name: 'L1 Approval', date: '2023-02-28', status: 'completed' },
      { name: 'L2 Approval', date: null, status: 'current' },
      { name: 'Payout', date: null, status: 'pending' },
      { name: 'Closed', date: null, status: 'pending' },
    ],
    auditTrail: [
      { timestamp: '2023-01-15T10:00:00Z', user: 'System', type: 'system', action: 'Claim created via API' },
      { timestamp: '2023-01-15T10:05:00Z', user: 'Intake Specialist', type: 'user', action: 'Initial data review completed' },
      { timestamp: '2023-01-20T11:30:00Z', user: 'System', type: 'system', action: 'Policy status validated' },
      { timestamp: '2023-02-10T14:15:00Z', user: 'Claims Examiner', type: 'user', action: 'Examiner review started' },
      { timestamp: '2023-02-25T09:00:00Z', user: 'Claims Examiner', type: 'user', action: 'Adjudication completed, recommended for approval' },
      { timestamp: '2023-02-28T16:00:00Z', user: 'Supervisor', type: 'user', action: 'Approved Level 1', comments: 'All docs verified.' },
      { timestamp: '2023-03-01T09:30:00Z', user: 'System', type: 'status-change', action: 'Status changed to Pending Level 2 Approval' },
    ],
    policyDetails: {
      product: 'Term Life Gold', issueDate: '2010-05-01', status: 'In-force', coverage: 'Whole Life',
      premiumsPaid: '$120,000', nextPremiumDue: 'N/A',
    },
    claimantDetails: {
      name: 'Jane Doe', relationship: 'Spouse', contact: 'jane.doe@email.com', address: '123 Main St',
      bankDetails: { bank: 'First National Bank', account: 'XXXX-1234' },
    },
    benefitCalculation: {
      grossBenefit: 500000, deductions: 0, taxWithholding: 0, netPayout: 500000,
    },
  },
  {
    id: 'A002-2023-005',
    type: 'Annuity withdrawal claim',
    policyNumber: 'AN12345678',
    insured: 'Mary Smith',
    claimant: 'Mary Smith',
    status: CLAIMS_STATUSES.PENDING_APPROVAL_1,
    amount: 25000,
    submissionDate: '2023-02-01',
    lastUpdate: '2023-02-20',
    assignedTo: 'Eva Examiner',
    riskScore: 'Low',
    slaStatus: 'On Track',
    documents: [
      { id: 'doc3', name: 'Withdrawal Request Form.pdf', status: 'Accepted', category: 'Mandatory' },
      { id: 'doc4', name: 'ID Proof.pdf', status: 'Accepted', category: 'Mandatory' },
    ],
    milestones: [
      { name: 'Intake', date: '2023-02-01', status: 'completed' },
      { name: 'Validation', date: '2023-02-05', status: 'completed' },
      { name: 'Examiner Review', date: '2023-02-15', status: 'completed' },
      { name: 'Adjudication', date: '2023-02-18', status: 'completed' },
      { name: 'L1 Approval', date: null, status: 'current' },
      { name: 'L2 Approval', date: null, status: 'pending' },
      { name: 'Payout', date: null, status: 'pending' },
      { name: 'Closed', date: null, status: 'pending' },
    ],
    auditTrail: [
      { timestamp: '2023-02-01T11:00:00Z', user: 'Call Center Agent', type: 'user', action: 'Claim created via assisted entry' },
      { timestamp: '2023-02-01T11:10:00Z', user: 'System', type: 'system', action: 'Automatic validation passed' },
      { timestamp: '2023-02-15T10:00:00Z', user: 'Eva Examiner', type: 'user', action: 'Review complete, awaiting approval' },
    ],
    policyDetails: { product: 'Fixed Annuity', issueDate: '2018-03-10', status: 'In-force', coverage: 'Annuity', premiumsPaid: '$150,000', nextPremiumDue: 'N/A' },
    claimantDetails: { name: 'Mary Smith', relationship: 'Self', contact: 'mary.smith@email.com', address: '456 Oak Ave', bankDetails: { bank: 'Second Bank', account: 'XXXX-5678' } },
    benefitCalculation: { grossBenefit: 25000, deductions: 500, taxWithholding: 0, netPayout: 24500 },
  },
  {
    id: 'L003-2023-010',
    type: 'Accidental death benefit claim',
    policyNumber: 'LP11223344',
    insured: 'Robert Green',
    claimant: 'Sarah Green',
    status: CLAIMS_STATUSES.COMPLIANCE_REVIEW,
    amount: 1000000,
    submissionDate: '2023-01-20',
    lastUpdate: '2023-02-25',
    assignedTo: 'Compliance Team',
    riskScore: 'Critical - Fraud Flagged',
    slaStatus: 'Breached',
    documents: [
      { id: 'doc5', name: 'Police Report.pdf', status: 'Accepted', category: 'Supporting' },
      { id: 'doc6', name: 'Medical Examiner Report.pdf', status: 'Accepted', category: 'Supporting' },
      { id: 'doc7', name: 'Beneficiary ID.pdf', status: 'Accepted', category: 'Mandatory' },
    ],
    milestones: [
      { name: 'Intake', date: '2023-01-20', status: 'completed' },
      { name: 'Validation', date: '2023-01-25', status: 'completed' },
      { name: 'Examiner Review', date: '2023-02-10', status: 'completed' },
      { name: 'Adjudication', date: '2023-02-15', status: 'completed' },
      { name: 'Medical Review', date: '2023-02-20', status: 'completed' },
      { name: 'Compliance Review', date: null, status: 'current' },
      { name: 'L1 Approval', date: null, status: 'pending' },
      { name: 'L2 Approval', date: null, status: 'pending' },
      { name: 'Payout', date: null, status: 'pending' },
      { name: 'Closed', date: null, status: 'pending' },
    ],
    auditTrail: [
      { timestamp: '2023-01-20T14:00:00Z', user: 'Intake Specialist', type: 'user', action: 'Claim created, high value' },
      { timestamp: '2023-01-25T15:00:00Z', user: 'System', type: 'system', action: 'Fraud indicators detected, flagged for review' },
      { timestamp: '2023-02-15T16:00:00Z', user: 'Claims Examiner', type: 'user', action: 'Completed review, escalated to Medical/Compliance' },
      { timestamp: '2023-02-20T10:00:00Z', user: 'Medical Reviewer', type: 'user', action: 'Medical review completed' },
      { timestamp: '2023-02-25T11:00:00Z', user: 'System', type: 'status-change', action: 'Status changed to Compliance Review' },
    ],
    policyDetails: { product: 'Accidental Death Rider', issueDate: '2015-01-01', status: 'In-force', coverage: 'AD&D', premiumsPaid: '$50,000', nextPremiumDue: 'N/A' },
    claimantDetails: { name: 'Sarah Green', relationship: 'Spouse', contact: 'sarah.green@email.com', address: '789 Pine Ln', bankDetails: { bank: 'Third Bank', account: 'XXXX-9012' } },
    benefitCalculation: { grossBenefit: 1000000, deductions: 0, taxWithholding: 0, netPayout: 1000000 },
  },
  {
    id: 'S004-2023-012',
    type: 'Surrender / partial surrender request',
    policyNumber: 'CA98765432',
    insured: 'David White',
    claimant: 'David White',
    status: CLAIMS_STATUSES.PAYOUT_PROCESSING,
    amount: 10000,
    submissionDate: '2023-02-10',
    lastUpdate: '2023-03-05',
    assignedTo: 'Finance Team',
    riskScore: 'Low',
    slaStatus: 'On Track',
    documents: [
      { id: 'doc8', name: 'Surrender Form.pdf', status: 'Accepted', category: 'Mandatory' },
    ],
    milestones: [
      { name: 'Intake', date: '2023-02-10', status: 'completed' },
      { name: 'Validation', date: '2023-02-12', status: 'completed' },
      { name: 'Examiner Review', date: '2023-02-15', status: 'completed' },
      { name: 'Adjudication', date: '2023-02-18', status: 'completed' },
      { name: 'L1 Approval', date: '2023-02-20', status: 'completed' },
      { name: 'L2 Approval', date: '2023-02-22', status: 'completed' },
      { name: 'Payout', date: null, status: 'current' },
      { name: 'Closed', date: null, status: 'pending' },
    ],
    auditTrail: [
      { timestamp: '2023-02-10T09:00:00Z', user: 'Claimant Portal', type: 'system', action: 'Claim submitted by claimant' },
      { timestamp: '2023-02-22T14:00:00Z', user: 'Senior Adjudicator', type: 'user', action: 'All approvals granted' },
      { timestamp: '2023-03-01T10:00:00Z', user: 'System', type: 'status-change', action: 'Status changed to Payout Processing' },
      { timestamp: '2023-03-05T11:00:00Z', user: 'Finance Officer', type: 'user', action: 'Payout initiated to claimant bank' },
    ],
    policyDetails: { product: 'Cash Value Policy', issueDate: '2012-07-01', status: 'In-force', coverage: 'Surrender Value', premiumsPaid: '$30,000', nextPremiumDue: 'N/A' },
    claimantDetails: { name: 'David White', relationship: 'Self', contact: 'david.white@email.com', address: '101 Elm St', bankDetails: { bank: 'Fourth Bank', account: 'XXXX-3456' } },
    benefitCalculation: { grossBenefit: 10000, deductions: 200, taxWithholding: 0, netPayout: 9800 },
  },
  {
    id: 'A005-2023-015',
    type: 'Annuity maturity payout',
    policyNumber: 'AN22334455',
    insured: 'Grace Black',
    claimant: 'Grace Black',
    status: CLAIMS_STATUSES.PAYOUT_COMPLETE,
    amount: 150000,
    submissionDate: '2023-01-01',
    lastUpdate: '2023-02-28',
    assignedTo: 'System',
    riskScore: 'Very Low',
    slaStatus: 'Completed On Time',
    documents: [],
    milestones: [
      { name: 'Intake', date: '2023-01-01', status: 'completed' },
      { name: 'Validation', date: '2023-01-02', status: 'completed' },
      { name: 'Adjudication', date: '2023-01-05', status: 'completed' },
      { name: 'L1 Approval', date: '2023-01-06', status: 'completed' },
      { name: 'Payout', date: '2023-01-10', status: 'completed' },
      { name: 'Closed', date: '2023-02-28', status: 'completed' },
    ],
    auditTrail: [
      { timestamp: '2023-01-01T08:00:00Z', user: 'System', type: 'system', action: 'Maturity payout initiated automatically' },
      { timestamp: '2023-01-10T12:00:00Z', user: 'Finance Officer', type: 'user', action: 'Payout successfully disbursed' },
      { timestamp: '2023-02-28T17:00:00Z', user: 'System', type: 'status-change', action: 'Claim status set to Closed' },
    ],
    policyDetails: { product: 'Maturity Annuity', issueDate: '2003-01-01', status: 'Matured', coverage: 'Maturity Benefit', premiumsPaid: '$100,000', nextPremiumDue: 'N/A' },
    claimantDetails: { name: 'Grace Black', relationship: 'Self', contact: 'grace.black@email.com', address: '222 River Rd', bankDetails: { bank: 'Fifth Bank', account: 'XXXX-7890' } },
    benefitCalculation: { grossBenefit: 150000, deductions: 0, taxWithholding: 0, netPayout: 150000 },
  },
  {
    id: 'L006-2023-018',
    type: 'Life death claim',
    policyNumber: 'LP55667788',
    insured: 'Frank Brown',
    claimant: 'Laura Brown',
    status: CLAIMS_STATUSES.REJECTED,
    amount: 250000,
    submissionDate: '2023-02-15',
    lastUpdate: '2023-03-10',
    assignedTo: 'Bob Claims',
    riskScore: 'Medium',
    slaStatus: 'On Track',
    documents: [
      { id: 'doc9', name: 'Death Certificate.pdf', status: 'Accepted', category: 'Mandatory' },
      { id: 'doc10', name: 'Contestability Review.pdf', status: 'Accepted', category: 'Supporting' },
    ],
    milestones: [
      { name: 'Intake', date: '2023-02-15', status: 'completed' },
      { name: 'Validation', date: '2023-02-18', status: 'completed' },
      { name: 'Examiner Review', date: '2023-02-25', status: 'completed' },
      { name: 'Adjudication', date: '2023-03-01', status: 'completed' },
      { name: 'L1 Approval', date: '2023-03-05', status: 'completed' },
      { name: 'Rejected', date: null, status: 'current' },
      { name: 'Closed', date: null, status: 'pending' },
    ],
    auditTrail: [
      { timestamp: '2023-02-15T10:00:00Z', user: 'Call Center Agent', type: 'user', action: 'Claim created via phone' },
      { timestamp: '2023-02-18T11:00:00Z', user: 'System', type: 'system', action: 'Contestability period flagged' },
      { timestamp: '2023-03-01T14:00:00Z', user: 'Claims Examiner', type: 'user', action: 'Adjudication complete, recommended for rejection due to contestability' },
      { timestamp: '2023-03-05T16:00:00Z', user: 'Supervisor', type: 'user', action: 'Approved Level 1 - Rejected Claim' },
      { timestamp: '2023-03-10T09:00:00Z', user: 'System', type: 'status-change', action: 'Status changed to Rejected' },
    ],
    policyDetails: { product: 'Term Life Basic', issueDate: '2022-08-01', status: 'In-force', coverage: 'Term Life', premiumsPaid: '$2,000', nextPremiumDue: '2023-08-01' },
    claimantDetails: { name: 'Laura Brown', relationship: 'Spouse', contact: 'laura.brown@email.com', address: '333 Circle Dr', bankDetails: { bank: 'N/A', account: 'N/A' } },
    benefitCalculation: { grossBenefit: 250000, deductions: 250000, taxWithholding: 0, netPayout: 0 },
  },
];

// 5. Dashboard Data (Sample KPIs for different personas)
const DASHBOARD_DATA = {
  EXECUTIVE_DASHBOARD: {
    title: 'Executive Overview Dashboard',
    kpis: [
      { id: 'kpi1', title: 'Total Claims Submitted', value: '1,520', trend: '+5%', type: 'positive', drillDown: { screen: 'CLAIM_LIST', filters: {} } },
      { id: 'kpi2', title: 'Open Claims', value: '345', trend: '-2%', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'OPEN' } } },
      { id: 'kpi3', title: 'Average Turnaround Time', value: '18 Days', trend: '+1 day', type: 'negative', drillDown: { screen: 'REPORTING_DASHBOARD', params: { report: 'tat' } } },
      { id: 'kpi4', title: 'SLA Breach Rate', value: '7%', trend: '+1%', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { slaStatus: 'BREACHED' } } },
      { id: 'kpi5', title: 'Straight-Through Processing', value: '45%', trend: '+3%', type: 'positive', drillDown: { screen: 'REPORTING_DASHBOARD', params: { report: 'stp' } } },
      { id: 'kpi6', title: 'Total Payouts (YTD)', value: '$125M', trend: '+10%', type: 'positive', drillDown: { screen: 'FINANCE_DASHBOARD', filters: { dateRange: 'YTD' } } },
    ],
    charts: [
      { id: 'chart1', title: 'Claims by Type', type: 'Donut' },
      { id: 'chart2', title: 'Open vs. Closed Claims Trend', type: 'Line' },
    ],
  },
  SUPERVISOR_DASHBOARD: {
    title: 'Supervisor Team Performance Dashboard',
    kpis: [
      { id: 'kpi1', title: 'Team Workload', value: '87 Claims', trend: '-5%', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { assignedToTeam: USER_DATA.name } } },
      { id: 'kpi2', title: 'Pending My Approvals', value: '12', trend: '+3', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'PENDING_APPROVAL_2', assignedTo: USER_DATA.name } } },
      { id: 'kpi3', title: 'Aging Claims (30+ Days)', value: '15', trend: '+2', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { aging: '30+' } } },
      { id: 'kpi4', title: 'Escalated Cases', value: '3', trend: 'N/A', type: 'neutral', drillDown: { screen: 'CLAIM_LIST', filters: { riskScore: 'High', status: 'ESCALATED' } } },
    ],
    charts: [
      { id: 'chart1', title: 'Claims by Examiner', type: 'Bar' },
      { id: 'chart2', title: 'SLA Status Overview', type: 'Donut' },
    ],
  },
  EXAMINER_DASHBOARD: {
    title: 'Examiner Work Dashboard',
    kpis: [
      { id: 'kpi1', title: 'My Open Claims', value: '25', trend: '-2%', type: 'positive', drillDown: { screen: 'CLAIM_LIST', filters: { assignedTo: USER_DATA.name, status: 'OPEN' } } },
      { id: 'kpi2', title: 'Claims Nearing SLA Breach', value: '3', trend: '+1', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { assignedTo: USER_DATA.name, slaStatus: 'Approaching Breach' } } },
      { id: 'kpi3', title: 'Missing Documents', value: '7', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { assignedTo: USER_DATA.name, status: 'DOCS_PENDING' } } },
      { id: 'kpi4', title: 'Returned Claims', value: '1', trend: 'N/A', type: 'neutral', drillDown: { screen: 'CLAIM_LIST', filters: { assignedTo: USER_DATA.name, status: 'RETURNED' } } },
    ],
    quickActions: [
      { label: 'Start New Claim', action: { screen: 'CLAIM_REGISTRATION' } },
      { label: 'Review My Queue', action: { screen: 'CLAIM_LIST', filters: { assignedTo: USER_DATA.name } } },
    ],
    charts: [],
  },
  INTAKE_DASHBOARD: {
    title: 'Intake Specialist Dashboard',
    kpis: [
      { id: 'kpi1', title: 'New Claims Received (Today)', value: '15', trend: '+10%', type: 'positive', drillDown: { screen: 'CLAIM_LIST', filters: { submissionDate: 'Today', status: 'NEW' } } },
      { id: 'kpi2', title: 'Incomplete Submissions', value: '8', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'INCOMPLETE' } } },
      { id: 'kpi3', title: 'Validation Failures', value: '2', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'VALIDATION_FAILED' } } },
      { id: 'kpi4', title: 'Documents Pending', value: '12', trend: '+3', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'DOCS_PENDING' } } },
    ],
    quickActions: [
      { label: 'Register New Claim', action: { screen: 'CLAIM_REGISTRATION' } },
      { label: 'Review New Claims', action: { screen: 'CLAIM_LIST', filters: { status: 'NEW' } } },
    ],
    charts: [],
  },
  FINANCE_DASHBOARD: {
    title: 'Finance & Payouts Dashboard',
    kpis: [
      { id: 'kpi1', title: 'Approved Payouts Awaiting Payment', value: '20', trend: '-5%', type: 'positive', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'APPROVED_FOR_PAYOUT' } } },
      { id: 'kpi2', title: 'Daily Payout Total', value: '$1.2M', trend: '+15%', type: 'positive', drillDown: { screen: 'REPORTING_DASHBOARD', params: { report: 'daily_payouts' } } },
      { id: 'kpi3', title: 'Payment Exceptions', value: '1', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'PAYOUT_EXCEPTION' } } },
      { id: 'kpi4', title: 'Failed Disbursements (Today)', value: '0', trend: 'N/A', type: 'positive', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'FAILED_DISBURSEMENT', date: 'Today' } } },
    ],
    charts: [
      { id: 'chart1', title: 'Payouts by Type (Monthly)', type: 'Bar' },
      { id: 'chart2', title: 'Tax Deduction Summary', type: 'Donut' },
    ],
  },
  COMPLIANCE_FRAUD_DASHBOARD: {
    title: 'Compliance & Fraud Dashboard',
    kpis: [
      { id: 'kpi1', title: 'Suspicious Claims (New)', value: '5', trend: '+2', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { riskScore: 'High', status: 'FRAUD_REVIEW' } } },
      { id: 'kpi2', title: 'AML/Sanctions Matches', value: '1', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { flag: 'AML_MATCH' } } },
      { id: 'kpi3', title: 'Claims Under Investigation', value: '7', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { status: 'UNDER_INVESTIGATION' } } },
      { id: 'kpi4', title: 'Contestability Alerts', value: '3', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { flag: 'CONTESTABILITY_ALERT' } } },
    ],
    charts: [
      { id: 'chart1', title: 'Claims by Fraud Flag Type', type: 'Donut' },
      { id: 'chart2', title: 'Investigation Lead Time', type: 'Gauge' },
    ],
  },
  CLAIMANT_DASHBOARD: {
    title: 'My Claims Overview',
    kpis: [
      { id: 'kpi1', title: 'Total Claims Submitted', value: '2', trend: 'N/A', type: 'neutral', drillDown: { screen: 'CLAIM_LIST', filters: { claimantId: USER_DATA.id } } },
      { id: 'kpi2', title: 'Claims In Progress', value: '1', trend: 'N/A', type: 'neutral', drillDown: { screen: 'CLAIM_LIST', filters: { claimantId: USER_DATA.id, status: 'IN_PROGRESS' } } },
      { id: 'kpi3', title: 'Approved Claims', value: '0', trend: 'N/A', type: 'positive', drillDown: { screen: 'CLAIM_LIST', filters: { claimantId: USER_DATA.id, status: 'APPROVED' } } },
      { id: 'kpi4', title: 'Documents Needed', value: '1', trend: 'N/A', type: 'negative', drillDown: { screen: 'CLAIM_LIST', filters: { claimantId: USER_DATA.id, status: 'DOCS_PENDING' } } },
    ],
    quickActions: [
      { label: 'Submit New Claim', action: { screen: 'CLAIM_REGISTRATION' } },
      { label: 'Upload Documents', action: { screen: 'DOCUMENT_UPLOAD' } },
    ],
    charts: [],
  },
  ADMIN_DASHBOARD: {
    title: 'System Administration Overview',
    kpis: [
      { id: 'kpi1', title: 'Active Users', value: '150', trend: '+5%', type: 'positive', drillDown: { screen: 'USER_MANAGEMENT' } },
      { id: 'kpi2', title: 'Rules Updated (Last 7 Days)', value: '12', trend: 'N/A', type: 'neutral', drillDown: { screen: 'ADMIN_CONFIGURATION', params: { tab: 'rules' } } },
      { id: 'kpi3', title: 'System Alerts (Critical)', value: '2', trend: 'N/A', type: 'negative', drillDown: { screen: 'NOTIFICATION_CENTER', filters: { type: 'critical' } } },
      { id: 'kpi4', title: 'API Integrations Status', value: 'All Green', trend: 'N/A', type: 'positive', drillDown: { screen: 'SYSTEM_HEALTH' } },
    ],
    charts: [],
  },
  DOCUMENT_DASHBOARD: {
    title: 'Document Verification Dashboard',
    kpis: [
      { id: 'kpi1', title: 'Documents Pending Verification', value: '45', trend: '+10%', type: 'negative', drillDown: { screen: 'DOCUMENT_MANAGEMENT', filters: { status: 'PENDING_VERIFICATION' } } },
      { id: 'kpi2', title: 'Documents Rejected (Today)', value: '3', trend: 'N/A', type: 'negative', drillDown: { screen: 'DOCUMENT_MANAGEMENT', filters: { status: 'REJECTED', date: 'Today' } } },
      { id: 'kpi3', title: 'Verification Backlog (Older than 7 Days)', value: '12', trend: '+2', type: 'negative', drillDown: { screen: 'DOCUMENT_MANAGEMENT', filters: { status: 'PENDING_VERIFICATION', aging: '7+' } } },
    ],
    quickActions: [
      { label: 'Start Document Review', action: { screen: 'DOCUMENT_MANAGEMENT', filters: { status: 'PENDING_VERIFICATION' } } },
    ],
    charts: [],
  },
};

// 6. Navigation Configuration (Role-based)
const NAVIGATION_ITEMS = {
  GENERAL: [
    { label: 'Dashboard', icon: 'icon-dashboard', screen: ROLE_DASHBOARD_MAP[USER_DATA.role] || 'EXAMINER_DASHBOARD' }, // Dynamic dashboard
    { label: 'My Claims', icon: 'icon-claims', screen: 'CLAIM_LIST', roles: [ROLES.CLAIMANT] },
  ],
  CLAIMS: [
    { label: 'New Claim Intake', icon: 'icon-claims', screen: 'CLAIM_REGISTRATION', roles: [ROLES.INTAKE_SPECIALIST, ROLES.CALL_CENTER_AGENT] },
    { label: 'Claims Work Queue', icon: 'icon-queue', screen: 'CLAIM_LIST', roles: [ROLES.INTAKE_SPECIALIST, ROLES.CLAIMS_EXAMINER, ROLES.SUPERVISOR, ROLES.SENIOR_ADJUDICATOR, ROLES.DOCUMENT_VERIFIER, ROLES.MEDICAL_LEGAL_COMPLIANCE, ROLES.UNDERWRITING_VALIDATION] },
    { label: 'Document Verification', icon: 'icon-docs', screen: 'DOCUMENT_MANAGEMENT', roles: [ROLES.DOCUMENT_VERIFIER, ROLES.INTAKE_SPECIALIST, ROLES.CLAIMS_EXAMINER] },
    { label: 'Approvals', icon: 'icon-approvals', screen: 'APPROVAL_QUEUE', roles: [ROLES.SUPERVISOR, ROLES.SENIOR_ADJUDICATOR, ROLES.FINANCE, ROLES.MEDICAL_LEGAL_COMPLIANCE] },
    { label: 'Payout Processing', icon: 'icon-payouts', screen: 'PAYOUT_PROCESSING', roles: [ROLES.FINANCE] },
    { label: 'Fraud & Compliance', icon: 'icon-compliance', screen: 'COMPLIANCE_FRAUD_DASHBOARD', roles: [ROLES.MEDICAL_LEGAL_COMPLIANCE] },
  ],
  ANALYTICS: [
    { label: 'Reporting & Analytics', icon: 'icon-analytics', screen: 'REPORTING_DASHBOARD', roles: [ROLES.EXECUTIVE, ROLES.SUPERVISOR, ROLES.OPERATIONS_ADMIN] },
    { label: 'SLA Monitoring', icon: 'icon-sla', screen: 'SLA_MONITOR', roles: [ROLES.SUPERVISOR, ROLES.OPERATIONS_ADMIN, ROLES.EXECUTIVE] },
  ],
  ADMINISTRATION: [
    { label: 'Admin Configuration', icon: 'icon-admin', screen: 'ADMIN_CONFIGURATION', roles: [ROLES.OPERATIONS_ADMIN] },
    { label: 'User & Role Management', icon: 'icon-user', screen: 'USER_MANAGEMENT', roles: [ROLES.OPERATIONS_ADMIN] },
    { label: 'Audit Log Viewer', icon: 'icon-audit', screen: 'AUDIT_LOG_VIEWER', roles: [ROLES.OPERATIONS_ADMIN, ROLES.EXECUTIVE, ROLES.MEDICAL_LEGAL_COMPLIANCE] },
  ],
  TOOLS: [
    { label: 'Notification Center', icon: 'icon-notifications', screen: 'NOTIFICATION_CENTER' },
  ]
};

// 7. Milestone Definitions for Workflow Tracking
const MILESTONE_DEFINITIONS = [
  'Claim Creation', 'Intake Review', 'Policy Validation', 'Document Verification',
  'Examiner Review', 'Adjudication', 'Medical/Legal Review', 'Multi-Level Approval',
  'Payout Processing', 'Claim Closure'
];

// 8. Document Checklist by Claim Type
const DOC_CHECKLIST_DATA = {
  'Life death claim': ['Death Certificate', 'Claimant ID Proof', 'Beneficiary Designation', 'Policy Document'],
  'Accidental death benefit claim': ['Death Certificate', 'Police Report', 'Medical Examiner Report', 'Claimant ID Proof'],
  'Annuity withdrawal claim': ['Annuity Withdrawal Request Form', 'Policy Owner ID Proof', 'Recent Annuity Statement'],
  'Annuity maturity payout': ['Maturity Claim Form', 'Policy Owner ID Proof'],
  'Beneficiary claim': ['Beneficiary Claim Form', 'Beneficiary ID Proof', 'Deceased Death Certificate'],
  'Surrender / partial surrender request': ['Surrender Request Form', 'Policy Owner ID Proof', 'Policy Document'],
  'Terminal illness benefit claim': ['Medical Diagnosis', 'Physician Statement', 'Policy Document', 'Claimant ID Proof'],
};

// --- II. Reusable Components ---

// Status Chip Component
const StatusChip = ({ status }) => {
  const statusInfo = CLAIMS_STATUSES[status?.toUpperCase()] || { label: status, colorClass: 'in-progress' };
  return (
    <span className={`status-chip ${statusInfo.colorClass}`} style={{ borderLeftColor: `var(--status-${statusInfo.colorClass}-border)` }}>
      {statusInfo.label}
    </span>
  );
};

// KPI Card Component with drill-down
const KPICard = ({ title, value, trend, type, onClick }) => (
  <div className="kpi-card clickable" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="kpi-card-title">{title}</div>
    <div className="kpi-card-value">
      {value}
      {trend && (
        <span className={`kpi-trend ${type === 'positive' ? 'positive' : 'negative'}`} style={{ fontSize: 'var(--font-size-sm)' }}>
          {type === 'positive' ? '▲' : '▼'} {trend}
        </span>
      )}
    </div>
  </div>
);

// Generic Chart Placeholder Component
const ChartComponent = ({ title, type }) => (
  <div className="chart-container card" style={{ padding: 'var(--spacing-lg)' }}>
    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>{title}</h4>
    <p style={{ color: 'var(--text-muted)' }}>{type} Chart Placeholder (Real-time)</p>
  </div>
);

// Claim Card Component
const ClaimCard = ({ claim, onClick }) => {
  const handleCardClick = useCallback(() => {
    onClick?.(claim.id);
  }, [claim.id, onClick]);

  return (
    <div className="card clickable" onClick={handleCardClick} style={{ borderRadius: 'var(--border-radius-lg)' }}>
      <div className="flex justify-between items-center">
        <h4 style={{ color: 'var(--color-primary)' }}>{claim?.id}</h4>
        <StatusChip status={claim?.status?.label} />
      </div>
      <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)' }}>{claim?.type}</p>
      <div className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
        <span><strong>Insured:</strong> {claim?.insured}</span>
        <span><strong>Claimant:</strong> {claim?.claimant}</span>
      </div>
      <div className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
        <span><strong>Amount:</strong> ${new Intl.NumberFormat().format(claim?.amount)}</span>
        <span><strong>Risk:</strong> <span style={{ color: claim?.riskScore === 'High' ? 'var(--color-danger)' : claim?.riskScore === 'Critical - Fraud Flagged' ? 'var(--color-danger)' : 'var(--color-success)' }}>{claim?.riskScore}</span></span>
      </div>
      <div className="flex justify-between" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        <span>Last Update: {claim?.lastUpdate}</span>
        <span>SLA: <span style={{ color: claim?.slaStatus === 'Breached' ? 'var(--color-danger)' : claim?.slaStatus === 'Approaching Breach' ? 'var(--color-warning)' : 'var(--color-success)' }}>{claim?.slaStatus}</span></span>
      </div>
    </div>
  );
};

// Milestone Tracker Component
const MilestoneTracker = ({ milestones }) => {
  const definedMilestones = MILESTONE_DEFINITIONS;
  const currentMilestoneIndex = milestones?.findIndex(m => m.status === 'current') || 0;

  return (
    <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Workflow Progress</h3>
      <div className="milestone-tracker">
        {definedMilestones.map((step, index) => (
          <div key={step} className={`milestone-step ${index < currentMilestoneIndex ? 'completed' : ''} ${index === currentMilestoneIndex ? 'current' : ''}`}>
            <div className="milestone-circle">
              {index < currentMilestoneIndex && <span style={{ color: 'white' }}>✓</span>}
            </div>
            <span className="milestone-step-label">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Feed Component (News/Audit Feed)
const ActivityFeed = ({ activities }) => (
  <div className="card" style={{ padding: 'var(--spacing-lg)', flex: '1' }}>
    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>News & Audit Feed</h3>
    <div className="activity-feed" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {activities?.length > 0 ? (
        activities.map((activity, index) => (
          <div key={index} className={`activity-item ${activity.type}`}>
            <div className="activity-content">
              <div className="activity-meta">
                {new Date(activity.timestamp).toLocaleString()} by {activity.user}
              </div>
              <p className="activity-text">{activity.action}</p>
              {activity.comments && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}><em>Comments: {activity.comments}</em></p>}
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No recent activity.</p>
      )}
    </div>
  </div>
);

// Document Management Panel
const DocumentManagementPanel = ({ documents, claimId, claimType }) => {
  const requiredDocs = DOC_CHECKLIST_DATA[claimType] || [];
  const handleUpload = () => alert('Document upload initiated for ' + claimId);
  const handleVerify = (docId) => alert('Verifying document: ' + docId);

  return (
    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Document Management</h3>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Documents for Claim {claimId}</h4>
        <button className="button button-primary" onClick={handleUpload}>
          <span className="icon"></span> Upload Document
        </button>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h5 style={{ marginBottom: 'var(--spacing-sm)' }}>Mandatory Document Checklist:</h5>
        <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-sm)' }}>
          {requiredDocs.map((docName) => {
            const isSubmitted = documents?.some(d => d.name?.includes(docName.split(' ')[0]) && d.status !== 'Rejected');
            const statusColor = isSubmitted ? 'var(--color-success)' : 'var(--color-danger)';
            return (
              <li key={docName} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: isSubmitted ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                <span style={{ color: statusColor }}>{isSubmitted ? '✓' : '✗'}</span> {docName}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="data-table-container">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents?.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.name}</td>
                  <td>{doc.category}</td>
                  <td><StatusChip status={doc.status === 'Accepted' ? 'approved' : doc.status === 'Rejected' ? 'rejected' : 'pending'} /></td>
                  <td>
                    <button className="button button-secondary" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }} onClick={() => alert('Preview ' + doc.name)}>Preview</button>
                    {(USER_DATA.role === ROLES.DOCUMENT_VERIFIER || USER_DATA.role === ROLES.CLAIMS_EXAMINER) && doc.status === 'Pending Verification' && (
                      <button className="button button-primary" style={{ marginLeft: 'var(--spacing-sm)', padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }} onClick={() => handleVerify(doc.id)}>Verify</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center" style={{ color: 'var(--text-muted)' }}>No documents uploaded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Approval Panel Component
const ApprovalPanel = ({ claim, onApprove, onReject, onRequestClarification }) => {
  const currentStatus = claim?.status?.label;
  const isApprover = (role) => [ROLES.SUPERVISOR, ROLES.SENIOR_ADJUDICATOR, ROLES.FINANCE, ROLES.MEDICAL_LEGAL_COMPLIANCE].includes(USER_DATA.role);
  const canApprove = (USER_DATA.role === ROLES.SUPERVISOR && currentStatus === CLAIMS_STATUSES.PENDING_APPROVAL_1.label) ||
                     (USER_DATA.role === ROLES.SENIOR_ADJUDICATOR && currentStatus === CLAIMS_STATUSES.PENDING_APPROVAL_2.label) ||
                     (USER_DATA.role === ROLES.FINANCE && currentStatus === CLAIMS_STATUSES.PENDING_FINANCE_APPROVAL.label) ||
                     ((USER_DATA.role === ROLES.MEDICAL_LEGAL_COMPLIANCE) && (currentStatus === CLAIMS_STATUSES.COMPLIANCE_REVIEW.label || currentStatus === CLAIMS_STATUSES.LEGAL_REVIEW.label));

  return (
    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Approval Workflow</h3>
      <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-md)' }}>
        Current Approval Stage: <StatusChip status={currentStatus} />
      </div>

      {isApprover(USER_DATA.role) && canApprove ? (
        <div className="flex gap-md mt-lg">
          <button className="button button-primary" onClick={() => onApprove(claim?.id)}>Approve</button>
          <button className="button button-danger" onClick={() => onReject(claim?.id)}>Reject</button>
          <button className="button button-secondary" onClick={() => onRequestClarification(claim?.id)}>Request Clarification</button>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>No pending approval action for your role at this stage.</p>
      )}

      <h4 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>Approval History</h4>
      <div className="activity-feed" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {claim?.auditTrail?.filter(entry => entry.action.includes('Approved') || entry.action.includes('Rejected')).map((log, index) => (
          <div key={index} className={`activity-item ${log.type}`}>
            <div className="activity-content">
              <div className="activity-meta">
                {new Date(log.timestamp).toLocaleString()} by {log.user}
              </div>
              <p className="activity-text"><strong>{log.action}</strong> {log.comments && ` - ${log.comments}`}</p>
            </div>
          </div>
        ))}
        {claim?.auditTrail?.filter(entry => entry.action.includes('Approved') || entry.action.includes('Rejected')).length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No approval history yet.</p>
        )}
      </div>
    </div>
  );
};


// Generic Form Renderer
const FormRenderer = ({ title, fields, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // Basic client-side validation placeholder
    const isValid = fields.every(field => !field.mandatory || (formData[field.name] && formData[field.name] !== ''));
    if (!isValid) {
      alert('Please fill in all mandatory fields.');
      return;
    }
    onSubmit(formData);
  }, [formData, fields, onSubmit]);

  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'var(--spacing-xl) auto' }}>
      <h2 style={{ marginBottom: 'var(--spacing-xl)' }}>{title}</h2>
      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className="form-group" key={field.name}>
            <label htmlFor={field.name}>{field.label}{field.mandatory && <span style={{ color: 'var(--color-danger)' }}>*</span>}</label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.mandatory}
                rows="4"
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.mandatory}
              >
                <option value="">Select...</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={field.type !== 'file' ? formData[field.name] || '' : undefined}
                onChange={handleChange}
                required={field.mandatory}
                readOnly={field.readOnly}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
        <button type="submit" className="button button-primary">Submit</button>
      </form>
    </div>
  );
};

// --- III. Screen Components ---

// Dashboard Screen
const DashboardScreen = ({ userRole, data, onDrillDown }) => {
  const dashboardConfig = DASHBOARD_DATA[data?.dashboardType || ROLE_DASHBOARD_MAP[userRole]] || DASHBOARD_DATA.EXAMINER_DASHBOARD;

  return (
    <>
      <h2 style={{ marginBottom: 'var(--spacing-xl)' }}>{dashboardConfig.title}</h2>
      <div className="dashboard-grid">
        {dashboardConfig.kpis?.map(kpi => (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            trend={kpi.trend}
            type={kpi.type}
            onClick={kpi.drillDown ? () => onDrillDown(kpi.drillDown.screen, kpi.drillDown.filters) : undefined}
          />
        ))}
        {dashboardConfig.quickActions?.map((action, index) => (
          <div key={`qa-${index}`} className="kpi-card clickable" onClick={() => onDrillDown(action.action.screen, action.action.filters || action.action.params)}>
            <div className="kpi-card-title">Quick Action</div>
            <div className="kpi-card-value" style={{ fontSize: 'var(--font-size-lg)', alignItems: 'center' }}>
              <span className="icon"></span> {action.label}
            </div>
          </div>
        ))}
      </div>
      <div className="card-grid">
        {dashboardConfig.charts?.map(chart => (
          <ChartComponent key={chart.id} title={chart.title} type={chart.type} />
        ))}
      </div>
    </>
  );
};

// Claim List Screen
const ClaimListScreen = ({ claims, onSelectClaim, filters, currentRole, onExport }) => {
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('submissionDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeFilters, setActiveFilters] = useState(filters || {}); // From drill-down

  useEffect(() => {
    setActiveFilters(filters || {});
  }, [filters]);

  const handleFilterChange = (e) => setFilterText(e.target.value);
  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredClaims = claims?.filter(claim => {
    const textMatch = filterText ?
      Object.values(claim).some(val =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      ) : true;

    const statusMatch = activeFilters.status ?
      (activeFilters.status === 'OPEN' ? !['Approved', 'Rejected', 'Payout Complete', 'Closed'].includes(claim.status.label) : claim.status.label === activeFilters.status) : true;
    
    const assignedToMatch = activeFilters.assignedTo ?
        claim.assignedTo === activeFilters.assignedTo : true;

    const slaStatusMatch = activeFilters.slaStatus ?
        claim.slaStatus === activeFilters.slaStatus : true;

    const riskScoreMatch = activeFilters.riskScore ?
        claim.riskScore === activeFilters.riskScore : true;

    return textMatch && statusMatch && assignedToMatch && slaStatusMatch && riskScoreMatch;
  });

  const sortedClaims = [...(filteredClaims || [])].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const availableFilters = {
    status: [...new Set(CLAIMS_DATA.map(c => c.status.label))].map(s => ({ label: s, value: s })),
    assignedTo: [...new Set(CLAIMS_DATA.map(c => c.assignedTo))].map(s => ({ label: s, value: s })),
    riskScore: [...new Set(CLAIMS_DATA.map(c => c.riskScore))].map(s => ({ label: s, value: s })),
    slaStatus: [...new Set(CLAIMS_DATA.map(c => c.slaStatus))].map(s => ({ label: s, value: s })),
  };

  return (
    <>
      <h2 style={{ marginBottom: 'var(--spacing-xl)' }}>Claims Work Queue</h2>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="flex justify-between items-center mb-md">
          <input
            type="text"
            className="global-search-input"
            placeholder="Search claims by ID, claimant, policy..."
            value={filterText}
            onChange={handleFilterChange}
            style={{ width: '400px' }}
          />
          <button className="button button-secondary" onClick={() => onExport?.(filteredClaims)}>
            <span className="icon"></span> Export to Excel
          </button>
        </div>
        <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
          {Object.entries(availableFilters).map(([filterName, options]) => (
            <div key={filterName} className="form-group" style={{ marginBottom: 0, width: '200px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)' }}>{filterName.charAt(0).toUpperCase() + filterName.slice(1).replace(/([A-Z])/g, ' $1')}:</label>
              <select
                value={activeFilters[filterName] || ''}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, [filterName]: e.target.value || undefined }))}
              >
                <option value="">All {filterName}</option>
                {options.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          ))}
          <button className="button button-secondary" onClick={() => setActiveFilters({})}>Clear Filters</button>
        </div>
      </div>

      <div className="card-grid">
        {sortedClaims?.length > 0 ? (
          sortedClaims.map(claim => (
            <ClaimCard key={claim.id} claim={claim} onClick={onSelectClaim} />
          ))
        ) : (
          <div className="text-center" style={{ gridColumn: '1 / -1', padding: 'var(--spacing-xxl)', color: 'var(--text-muted)' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>No Claims Found</h3>
            <p>Adjust your filters or submit a new claim.</p>
            {(currentRole === ROLES.INTAKE_SPECIALIST || currentRole === ROLES.CALL_CENTER_AGENT) && (
              <button className="button button-primary mt-lg" onClick={() => onSelectClaim('NEW')}>
                <span className="icon"></span> Register New Claim
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Claim Detail Summary Page (Record Summary Page)
const ClaimDetailScreen = ({ claim, onGoBack, onUpdateClaimStatus }) => {
  const handleApprove = (id) => {
    alert(`Claim ${id} Approved!`);
    onUpdateClaimStatus(id, CLAIMS_STATUSES.APPROVED);
  };
  const handleReject = (id) => {
    alert(`Claim ${id} Rejected!`);
    onUpdateClaimStatus(id, CLAIMS_STATUSES.REJECTED);
  };
  const handleRequestClarification = (id) => {
    alert(`Clarification requested for Claim ${id}.`);
    onUpdateClaimStatus(id, CLAIMS_STATUSES.PENDING_ADD_INFO);
  };
  const handleEdit = () => {
    alert('Edit Claim not implemented fully yet.');
    // In a real app, this would navigate to a ClaimEditForm
  };

  if (!claim) {
    return (
      <div className="text-center" style={{ padding: 'var(--spacing-xxl)' }}>
        <h2 style={{ color: 'var(--text-main)' }}>Claim Not Found</h2>
        <button className="button button-secondary mt-lg" onClick={onGoBack}>Back to Claims List</button>
      </div>
    );
  }

  const sections = [
    { title: 'Claim Overview', content: (
      <div className="grid-cols-2" style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        <p><strong>Claim Type:</strong> {claim?.type}</p>
        <p><strong>Policy Number:</strong> {claim?.policyNumber}</p>
        <p><strong>Status:</strong> <StatusChip status={claim?.status?.label} /></p>
        <p><strong>Submission Date:</strong> {claim?.submissionDate}</p>
        <p><strong>Last Update:</strong> {claim?.lastUpdate}</p>
        <p><strong>Assigned To:</strong> {claim?.assignedTo}</p>
        <p><strong>Risk Score:</strong> <span style={{ color: claim?.riskScore === 'High' ? 'var(--color-danger)' : claim?.riskScore === 'Critical - Fraud Flagged' ? 'var(--color-danger)' : 'var(--color-success)' }}>{claim?.riskScore}</span></p>
        <p><strong>SLA Status:</strong> <span style={{ color: claim?.slaStatus === 'Breached' ? 'var(--color-danger)' : claim?.slaStatus === 'Approaching Breach' ? 'var(--color-warning)' : 'var(--color-success)' }}>{claim?.slaStatus}</span></p>
      </div>
    )},
    { title: 'Policy Details', content: (
      <div className="grid-cols-2" style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        <p><strong>Product:</strong> {claim?.policyDetails?.product}</p>
        <p><strong>Issue Date:</strong> {claim?.policyDetails?.issueDate}</p>
        <p><strong>Policy Status:</strong> {claim?.policyDetails?.status}</p>
        <p><strong>Coverage:</strong> {claim?.policyDetails?.coverage}</p>
        <p><strong>Premiums Paid:</strong> {claim?.policyDetails?.premiumsPaid}</p>
        <p><strong>Next Premium Due:</strong> {claim?.policyDetails?.nextPremiumDue}</p>
      </div>
    )},
    { title: 'Claimant & Beneficiary', content: (
      <div className="grid-cols-2" style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        <p><strong>Claimant Name:</strong> {claim?.claimantDetails?.name}</p>
        <p><strong>Relationship:</strong> {claim?.claimantDetails?.relationship}</p>
        <p><strong>Contact Email:</strong> {claim?.claimantDetails?.contact}</p>
        <p><strong>Address:</strong> {claim?.claimantDetails?.address}</p>
        <p><strong>Bank:</strong> {claim?.claimantDetails?.bankDetails?.bank}</p>
        <p><strong>Account:</strong> {claim?.claimantDetails?.bankDetails?.account}</p>
      </div>
    )},
    { title: 'Benefit Calculation', content: (
      <div className="grid-cols-2" style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        <p><strong>Gross Benefit:</strong> ${new Intl.NumberFormat().format(claim?.benefitCalculation?.grossBenefit)}</p>
        <p><strong>Deductions:</strong> ${new Intl.NumberFormat().format(claim?.benefitCalculation?.deductions)}</p>
        <p><strong>Tax Withholding:</strong> ${new Intl.NumberFormat().format(claim?.benefitCalculation?.taxWithholding)}</p>
        <p><strong>Net Payout:</strong> <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>${new Intl.NumberFormat().format(claim?.benefitCalculation?.netPayout)}</strong></p>
      </div>
    )},
  ];

  const canEdit = [ROLES.CLAIMS_EXAMINER, ROLES.INTAKE_SPECIALIST, ROLES.SUPERVISOR].includes(USER_DATA.role);

  return (
    <>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
        <div className="flex flex-col">
          <button className="button button-secondary" onClick={onGoBack} style={{ marginBottom: 'var(--spacing-sm)', width: 'fit-content' }}>{'< Back to Claims List'}</button>
          <h1 style={{ marginBottom: 0 }}>Claim Details: {claim?.id}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Policy: {claim?.policyNumber} | Insured: {claim?.insured}</p>
        </div>
        {canEdit && (
          <button className="button button-primary" onClick={handleEdit}>
            <span className="icon"></span> Edit Claim
          </button>
        )}
      </div>

      <MilestoneTracker milestones={claim?.milestones} />

      <div className="card-grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
        <div className="flex flex-col gap-lg">
          {sections.map((section, index) => (
            <div key={index} className="card p-lg">
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>{section.title}</h3>
              {section.content}
            </div>
          ))}
        </div>
        <ActivityFeed activities={claim?.auditTrail} />
      </div>

      <DocumentManagementPanel documents={claim?.documents} claimId={claim?.id} claimType={claim?.type} />

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <ApprovalPanel claim={claim} onApprove={handleApprove} onReject={handleReject} onRequestClarification={handleRequestClarification} />
      </div>
    </>
  );
};

// Claim Registration Screen
const ClaimRegistrationScreen = ({ onSubmit }) => {
  const claimFields = [
    { name: 'policyNumber', label: 'Policy Number', type: 'text', mandatory: true },
    { name: 'claimType', label: 'Claim Type', type: 'select', mandatory: true, options: Object.keys(DOC_CHECKLIST_DATA).map(key => ({ label: key, value: key })) },
    { name: 'insuredName', label: 'Insured Name', type: 'text', mandatory: true },
    { name: 'claimantName', label: 'Claimant Name', type: 'text', mandatory: true },
    { name: 'eventDate', label: 'Date of Event', type: 'date', mandatory: true },
    { name: 'causeOfClaim', label: 'Cause of Claim', type: 'textarea', mandatory: true },
    { name: 'payoutPreference', label: 'Payout Preference', type: 'select', mandatory: false, options: [{ label: 'Bank Transfer', value: 'bank' }, { label: 'Check', value: 'check' }] },
    { name: 'bankName', label: 'Bank Name', type: 'text', mandatory: false, placeholder: 'If Bank Transfer selected' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', mandatory: false, placeholder: 'If Bank Transfer selected' },
    { name: 'routingNumber', label: 'Routing Number', type: 'text', mandatory: false, placeholder: 'If Bank Transfer selected' },
    { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', mandatory: false },
    { name: 'documentUpload', label: 'Upload Initial Documents', type: 'file', mandatory: false }, // Placeholder for actual file upload
  ];

  const handleSubmitRegistration = useCallback((data) => {
    alert('Claim Registration Submitted! (See console for data)');
    console.log('New Claim Data:', data);
    // In a real app, this would trigger an API call to create a new claim
    // and then navigate to the newly created claim's detail page or work queue.
    onSubmit();
  }, [onSubmit]);

  return <FormRenderer title="New Claim Registration" fields={claimFields} onSubmit={handleSubmitRegistration} />;
};

// Generic Admin Configuration Screen
const AdminConfigurationScreen = ({ onGoBack }) => {
  const adminSections = [
    { title: 'Business Rules Management', description: 'Configure rules for STP, routing, and alerts.' },
    { title: 'User & Role Permissions', description: 'Manage access control and role assignments.' },
    { title: 'Threshold & Limit Configuration', description: 'Set approval limits and benefit caps.' },
    { title: 'Integration Settings', description: 'Configure API endpoints and external system connections.' },
    { title: 'Audit Trail & Retention Policies', description: 'Manage logging and data retention.' },
  ];

  return (
    <>
      <button className="button button-secondary" onClick={onGoBack} style={{ marginBottom: 'var(--spacing-md)' }}>{'< Back to Dashboard'}</button>
      <h2 style={{ marginBottom: 'var(--spacing-xl)' }}>Admin Configuration</h2>
      <div className="card-grid">
        {adminSections.map((section, index) => (
          <div key={index} className="card clickable" onClick={() => alert(`Navigating to ${section.title} configuration.`)}>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{section.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{section.description}</p>
          </div>
        ))}
      </div>
    </>
  );
};

// Generic Reporting Dashboard
const ReportingDashboard = ({ onGoBack, params }) => {
  const reportType = params?.report || 'Overview';
  return (
    <>
      <button className="button button-secondary" onClick={onGoBack} style={{ marginBottom: 'var(--spacing-md)' }}>{'< Back to Dashboard'}</button>
      <h2 style={{ marginBottom: 'var(--spacing-xl)' }}>Reporting & Analytics: {reportType}</h2>
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        <ChartComponent title="Claims by Status" type="Bar" />
        <ChartComponent title="Claims by Product Line" type="Donut" />
        <ChartComponent title="Average Time to Approval" type="Line" />
        <ChartComponent title="Payouts by Region" type="Bar" />
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Export Options</h3>
          <div className="flex gap-md">
            <button className="button button-primary">Export to PDF</button>
            <button className="button button-primary">Export to Excel</button>
          </div>
        </div>
      </div>
    </>
  );
};

// Placeholder for other screens, following the card-first, full-screen pattern
const GenericPlaceholderScreen = ({ title, onGoBack, message = "This is a placeholder screen for future development. Content will be added here." }) => (
  <>
    <button className="button button-secondary" onClick={onGoBack} style={{ marginBottom: 'var(--spacing-md)' }}>{'< Back'}</button>
    <div className="card text-center" style={{ maxWidth: '800px', margin: 'var(--spacing-xxl) auto' }}>
      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  </>
);


// --- Main Application Component ---
function App() {
  const [view, setView] = useState({ screen: ROLE_DASHBOARD_MAP[USER_DATA.role], params: {} });
  const [claims, setClaims] = useState(CLAIMS_DATA);

  const navigateTo = useCallback((screen, params = {}) => {
    setView({ screen, params });
  }, []);

  const getBreadcrumbs = useCallback(() => {
    const crumbs = [{ label: 'Home', screen: ROLE_DASHBOARD_MAP[USER_DATA.role] }];
    if (view.screen !== ROLE_DASHBOARD_MAP[USER_DATA.role]) {
      if (view.screen === 'CLAIM_LIST' && view.params?.claimId) {
        crumbs.push({ label: 'Claims List', screen: 'CLAIM_LIST' });
        crumbs.push({ label: `Claim: ${view.params.claimId}`, screen: 'CLAIM_DETAIL', params: { claimId: view.params.claimId } });
      } else if (view.screen.startsWith('CLAIM_')) {
        crumbs.push({ label: view.screen.replace(/_/g, ' ').replace('CLAIM', 'Claim'), screen: view.screen, params: view.params });
      } else if (view.screen.endsWith('_DASHBOARD')) {
        crumbs.push({ label: view.screen.replace(/_/g, ' ').replace('DASHBOARD', 'Dashboard'), screen: view.screen, params: view.params });
      } else if (view.screen === 'ADMIN_CONFIGURATION') {
        crumbs.push({ label: 'Admin Configuration', screen: 'ADMIN_CONFIGURATION', params: view.params });
      } else if (view.screen === 'REPORTING_DASHBOARD') {
        crumbs.push({ label: 'Reporting', screen: 'REPORTING_DASHBOARD', params: view.params });
      } else {
        crumbs.push({ label: view.screen.replace(/_/g, ' '), screen: view.screen, params: view.params });
      }
    }
    return crumbs;
  }, [view.screen, view.params]);

  const handleClaimCardClick = useCallback((claimId) => {
    navigateTo('CLAIM_DETAIL', { claimId });
  }, [navigateTo]);

  const handleDashboardDrillDown = useCallback((screen, filters = {}) => {
    // For simplicity, map all drill-downs to CLAIM_LIST for now if they involve claims.
    if (screen === 'CLAIM_LIST') {
      navigateTo('CLAIM_LIST', { filters });
    } else if (screen === 'REPORTING_DASHBOARD') {
      navigateTo('REPORTING_DASHBOARD', { report: filters?.report });
    } else {
      navigateTo(screen, filters); // Handle other specific screen navigations
    }
  }, [navigateTo]);

  const handleUpdateClaimStatus = useCallback((claimId, newStatus) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId
          ? {
              ...claim,
              status: newStatus,
              lastUpdate: new Date().toISOString().split('T')[0],
              auditTrail: [
                ...(claim.auditTrail || []),
                {
                  timestamp: new Date().toISOString(),
                  user: USER_DATA.name,
                  type: 'status-change',
                  action: `Status changed to ${newStatus.label}`,
                },
              ],
              milestones: claim.milestones?.map(m =>
                m.status === 'current'
                  ? { ...m, status: 'completed', date: new Date().toISOString().split('T')[0] }
                  : m
              ).concat(
                newStatus.label === CLAIMS_STATUSES.APPROVED.label ? [{ name: 'Payout', status: 'current' }] :
                newStatus.label === CLAIMS_STATUSES.REJECTED.label ? [{ name: 'Rejected', status: 'current' }] :
                []
              ).filter(m => m.status !== 'pending' || m.status === 'current') // Simplistic milestone update logic
            }
          : claim
      )
    );
    alert(`Claim ${claimId} status updated to ${newStatus.label}.`);
  }, []);

  const renderContent = useCallback(() => {
    const currentClaim = claims.find(c => c.id === view.params?.claimId);
    const userHasAccess = (roles) => roles === undefined || roles.includes(USER_DATA.role);

    // Filter navigation items based on user role
    const filteredNavigation = Object.entries(NAVIGATION_ITEMS).reduce((acc, [category, items]) => {
      const allowedItems = items.filter(item => userHasAccess(item.roles));
      if (allowedItems.length > 0) {
        acc[category] = allowedItems;
      }
      return acc;
    }, {});

    switch (view.screen) {
      case 'CLAIM_LIST':
        return (
          <ClaimListScreen
            claims={claims}
            onSelectClaim={handleClaimCardClick}
            filters={view.params?.filters}
            currentRole={USER_DATA.role}
            onExport={(data) => console.log('Exporting claims:', data)}
          />
        );
      case 'CLAIM_DETAIL':
        return (
          <ClaimDetailScreen
            claim={currentClaim}
            onGoBack={() => navigateTo('CLAIM_LIST')}
            onUpdateClaimStatus={handleUpdateClaimStatus}
          />
        );
      case 'CLAIM_REGISTRATION':
        return (
          <ClaimRegistrationScreen onSubmit={() => navigateTo(ROLE_DASHBOARD_MAP[USER_DATA.role])} />
        );
      case 'ADMIN_CONFIGURATION':
        return <AdminConfigurationScreen onGoBack={() => navigateTo(ROLE_DASHBOARD_MAP[USER_DATA.role])} />;
      case 'REPORTING_DASHBOARD':
        return <ReportingDashboard onGoBack={() => navigateTo(ROLE_DASHBOARD_MAP[USER_DATA.role])} params={view.params} />;
      case 'EXECUTIVE_DASHBOARD':
      case 'SUPERVISOR_DASHBOARD':
      case 'EXAMINER_DASHBOARD':
      case 'INTAKE_DASHBOARD':
      case 'FINANCE_DASHBOARD':
      case 'COMPLIANCE_FRAUD_DASHBOARD':
      case 'CLAIMANT_DASHBOARD':
      case 'ADMIN_DASHBOARD':
      case 'DOCUMENT_DASHBOARD':
        return <DashboardScreen userRole={USER_DATA.role} data={{ dashboardType: view.screen }} onDrillDown={handleDashboardDrillDown} />;
      case 'APPROVAL_QUEUE':
      case 'PAYOUT_PROCESSING':
      case 'SLA_MONITOR':
      case 'USER_MANAGEMENT':
      case 'AUDIT_LOG_VIEWER':
      case 'NOTIFICATION_CENTER':
      case 'DOCUMENT_MANAGEMENT': // General document management screen
        return <GenericPlaceholderScreen title={view.screen.replace(/_/g, ' ')} onGoBack={() => navigateTo(ROLE_DASHBOARD_MAP[USER_DATA.role])} />;
      default:
        return (
          <div className="card text-center" style={{ maxWidth: '800px', margin: 'var(--spacing-xxl) auto' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Welcome, {USER_DATA.name}!</h2>
            <p style={{ color: 'var(--text-muted)' }}>You are logged in as a {USER_DATA.role}.</p>
            <p style={{ color: 'var(--text-muted)' }}>You landed on an unrecognized screen: <strong>{view.screen}</strong>. Navigating to your default dashboard.</p>
            <button className="button button-primary mt-lg" onClick={() => navigateTo(ROLE_DASHBOARD_MAP[USER_DATA.role])}>
              Go to my Dashboard
            </button>
          </div>
        );
    }
  }, [view, claims, navigateTo, handleClaimCardClick, handleDashboardDrillDown, handleUpdateClaimStatus]);


  // Determine if sidebar should be shown (e.g., not for external claimant portal)
  const showSidebar = USER_DATA.role !== ROLES.CLAIMANT;

  const currentBreadcrumbs = getBreadcrumbs();

  return (
  <div className="app-container">

    {/* ✅ HEADER FIXED */}
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Claims Management</h1>

        {currentBreadcrumbs.length > 1 && (
          <div className="breadcrumbs">
            {currentBreadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <a
                  href="#"
                  onClick={() => navigateTo(crumb.screen, crumb.params)}
                  style={{
                    color:
                      index === currentBreadcrumbs.length - 1
                        ? 'var(--text-main)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {crumb.label}
                </a>
                {index < currentBreadcrumbs.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="header-right">
        <input
          type="text"
          placeholder="Global Search..."
          className="global-search-input"
        />

        <button
          className="button button-primary"
          onClick={() => navigateTo('CLAIM_REGISTRATION')}
          style={{ marginLeft: 'var(--spacing-md)' }}
        >
          Initiate Claim
        </button>

        <button className="button button-secondary">
          Notifications
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span>{USER_DATA.name} ({USER_DATA.role})</span>

          <button
            className="button button-secondary"
            onClick={() => alert('Logged out!')}
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    {/* ✅ LAYOUT FIXED */}
    <div className="layout-with-sidebar">

      {showSidebar && (
        <aside className="nav-sidebar">
          {Object.entries(NAVIGATION_ITEMS).reduce((acc, [category, items]) => {
            const allowedItems = items.filter(
              (item) => !item.roles || item.roles.includes(USER_DATA.role)
            );

            if (allowedItems.length > 0) {
              acc.push(
                <h4
                  key={category}
                  style={{
                    marginTop: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-xs)',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-size-sm)',
                    textTransform: 'uppercase',
                  }}
                >
                  {category}
                </h4>
              );

              allowedItems.forEach((item) => {
                acc.push(
                  <div
                    key={item.screen}
                    className={`nav-sidebar-item ${
                      view.screen === item.screen ? 'active' : ''
                    }`}
                    onClick={() => navigateTo(item.screen, item.params)}
                  >
                    {item.label}
                  </div>
                );
              });
            }

            return acc;
          }, [])}
        </aside>
      )}

      {/* ✅ MAIN CONTENT */}
      <main className="main-content-area">
        {renderContent()}
      </main>

    </div>
  </div>
);
}

export default App;
