const express = require('express')
const bcrypt = require('bcrypt')
const { dataSource } = require('../db/data-source')
const { dbEntityNameUser } = require('../entities/User')
const logger = require('../utils/logger')(dbEntityNameUser)
const responseSend = require('../utils/serverResponse')
const { isNotValidString, isNotValidPassword, isNotValidUserName, isNotValidEmail } = require('../utils/validation')
const router = express.Router()
const saltRounds = 10

/** 使用者註冊 */
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password } = req.body

        if (isNotValidString(name) || isNotValidString(password) || isNotValidString(email)) {
            responseSend(res, 400, '欄位未填寫正確', logger)
            return
        }
        if (isNotValidPassword(password)) {
            responseSend(res, 400, '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字', logger)
            return
        }
        if (isNotValidUserName(name)) {
            responseSend(res, 400, '使用者名稱不符合規則，最少2個字，最多10個字，不可包含任何特殊符號與空白', logger)
            return
        }
        if (isNotValidEmail(email)) {
            responseSend(res, 400, '不符合Email的格式字串', logger)
            return
        }

        const userRepository = dataSource.getRepository(dbEntityNameUser)
        // 檢查 email 是否已存在
        const existingUser = await userRepository.findOne({ where: { email } })
    
        if (existingUser) {
            responseSend(res, 409, 'Email 已被使用', logger)
            return
        }

        // 建立新使用者
        const hashPassword = await bcrypt.hash(password, saltRounds)
        const newUser = userRepository.create({
            name,
            email,
            role: 'USER',
            password: hashPassword
        })

        const savedUser = await userRepository.save(newUser)
        logger.info('新建立的使用者ID:', savedUser.id)

        responseSend(res, 201, {
            user: {
                id: savedUser.id,
                name: savedUser.name
            }
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

module.exports = router