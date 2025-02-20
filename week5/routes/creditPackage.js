const express = require('express')
const { dataSource } = require('../db/data-source')
const { dbEntityNameCreditPackage } = require('../entities/CreditPackages')
const logger = require('../utils/logger')(dbEntityNameCreditPackage)
const responseSend = require('../utils/serverResponse')
const { isNotValidString, isNotValidInteger, isNotValidUuid } = require('../utils/validation')
const router = express.Router()

/** 取得購買方案列表 */
router.get('/', async (req, res, next) => {
    try {
        const creditPackage = await dataSource.getRepository(dbEntityNameCreditPackage).find({
            select: ['id', 'name', 'credit_amount', 'price']
        })
        responseSend(res, 200, creditPackage)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

/** 新增購買方案 */
router.post('/', async (req, res, next) => {
    try {
        const { name, credit_amount: creditAmount, price } = req.body
        if (isNotValidString(name) || isNotValidInteger(creditAmount) || isNotValidInteger(price)) {
            responseSend(res, 400, '欄位未填寫正確', logger)
            return
        }
        const creditPurchaseRepo = await dataSource.getRepository(dbEntityNameCreditPackage)
        const existCreditPurchase = await creditPurchaseRepo.find({
            where: { name }
        })

        if (existCreditPurchase.length > 0) {
            responseSend(res, 409, '資料重複', logger)
            return
        }

        const newCreditPurchase = await creditPurchaseRepo.create({
            name,
            credit_amount: creditAmount,
            price
        })

        const result = await creditPurchaseRepo.save(newCreditPurchase)
        delete result.createdAt;
        responseSend(res, 200, result)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

/** 刪除購買方案 */
router.delete('/:creditPackageId', async (req, res, next) => {
    try {
        const { creditPackageId } = req.params
        if (isNotValidUuid(creditPackageId)) {
            responseSend(res, 400, 'ID錯誤', logger)
            return
        }
        const result = await dataSource.getRepository(dbEntityNameCreditPackage).delete(creditPackageId)
        if (result.affected === 0) {
            responseSend(res, 400, 'ID錯誤', logger)
            return
        }
        responseSend(res, 200)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

module.exports = router