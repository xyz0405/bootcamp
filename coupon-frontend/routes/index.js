const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../app/models/config');
const auth = require('./auth');

router.get('/', (req, res, next) => {
    return res.render('index', {providers: config.providers});
});
router.post('/', (req, res, next) => {
    request.post(config.apiUrl + '/users', {form: req.body}).pipe(res);
});

router.get('/login', (req, res, next) => {
    return res.render('login');
});
router.post('/login', (req, res, next) => {
    request.post(config.apiUrl + '/auth/token', {form: req.body}).pipe(res);
});

router.all('/logout', (req, res, next) => {
    return res.render('logout');
});

router.get('/admin', auth.adminRequired, (req, res, next) => {
    if (req.user.isAdmin || req.user.isSuperAdmin)
        return res.redirect('/admin/coupons?token=' + req.token);
    return res.render('logout');
});

router.get('/admin/coupons', auth.adminRequired, (req, res, next) => {
    return res.render('coupons', {
        token: req.token,
        isAdmin: !!req.user.isAdmin,
        isSuperAdmin: !!req.user.isSuperAdmin
    });
});
router.post('/admin/coupons', auth.adminRequired, (req, res, next) => {
    req.body.postedBy = req.user.id;
    if (!req.body.companyName) req.body.companyName = req.user.companyName;
    request.post({
        url: config.apiUrl + '/coupons',
        headers: {'x-access-token': req.token},
        form: req.body
    }).pipe(res);
});

router.get('/admin/users', auth.superAdminRequired, (req, res, next) => {
    return res.render('users', {token: req.token, providers: config.providers});
});
router.post('/admin/users', auth.adminRequired, (req, res, next) => {
    if (!req.user.isSuperAdmin) return res.status(403).send('Superadmin privileges required');
    request.post({
        url: config.apiUrl + '/admins',
        headers: {'x-access-token': req.token},
        form: req.body
    }).pipe(res);
});

router.get('/admin/manage', auth.superAdminRequired, (req, res, next) => {
    return res.render('manage', {token: req.token});
});
router.get('/admin/manage/unapproved', auth.superAdminRequired, (req, res, next) => {
    request.get({
        url: config.apiUrl + '/admins/coupons',
        headers: {'x-access-token': req.token},
    }).pipe(res);
});
router.post('/admin/manage/unapproved', auth.superAdminRequired, (req, res, next) => {
    if (!req.body.id) return res.status(400).send('No ID');
    request.post({
        url: config.apiUrl + '/coupons/' + req.body.id,
        headers: {'x-access-token': req.token},
    }).pipe(res);
});
router.get('/admin/manage/active', auth.superAdminRequired, (req, res, next) => {
    request.get({
        url: config.apiUrl + '/coupons',
        headers: {'x-access-token': req.token},
    }).pipe(res);
});
router.post('/admin/manage/active', auth.superAdminRequired, (req, res, next) => {
    if (!req.body.id) return res.status(400).send('No ID');
    request.post({
        url: config.apiUrl + '/coupons/' + req.body.id + '/send',
        headers: {'x-access-token': req.token},
    }).pipe(res);
});

module.exports = router;
