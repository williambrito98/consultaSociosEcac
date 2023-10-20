const makeBrowser = require('./factories/makeBrowser')
const { WrongUserKey, ZeroBalance } = require('./errors/captcha')
const makePage = require('./factories/makePage')
const DownloadTimeoutError = require('./errors/browser/DownloadTimeoutError')
const loginEcac = require('./pages/loginEcac')
const getQuadroSocietario = require('./pages/getQuadroSocietario')
/**
 *
 * @param {{values : Array, __root_dir : string}} data
 * @param {import('../selectors.json')} selectors
 * @param {Function(string)} log
 */
module.exports = async (data, selectors, log) => {
    try {
        let browser, page, lastIndex, page2
        ({ browser } = await makeBrowser())
        try {
            ({ page } = await makePage(browser))
            await page.goto(selectors.site_url, { waitUntil: 'networkidle0' })
            await loginEcac(page, selectors)
            for (const [index, cliente] of Object.entries(data.values)) {
                console.log(cliente)
                lastIndex = index
                const CNPJ = cliente.CNPJ.toString().trim()
                const RAZAO = cliente.RAZAO.toString().replace(/:|\/|\.|\\/gmi, '').trim()
                log('ALTERANDO PERFIL')
                await alterarPerfil(page, CNPJ, selectors);
                ({ page: page2 } = await makePage(browser))
                const socios = await getQuadroSocietario(page2, selectors)
            }
            await browser.close()
            return {
                status: true
            }
        } catch (error) {
            log(error.message)
            if (error instanceof WrongUserKey) {
                return {
                    status: false,
                    continue: false,
                    error: error.message
                }
            }
            if (error instanceof ZeroBalance) {
                return {
                    status: false,
                    continue: false,
                    error: error.message
                }
            }

            if (error instanceof DownloadTimeoutError) {
                return {
                    status: false,
                    continue: true,
                    error: error.message,
                    repeat: true,
                    lastIndex
                }
            }

            if (error instanceof PageError) {
                log(error.message)
                return {
                    status: false,
                    continue: true,
                    repeat: false,
                    error: error.message,
                    lastIndex
                }
            }

            return {
                status: false,
                continue: true,
                repeat: true,
                lastIndex,
                error: error?.message
            }
        }
    } catch (error) {
        log('Erro ao inicializar robo')
        return {
            status: false,
            continue: false,
            error: error?.message
        }
    }
}
