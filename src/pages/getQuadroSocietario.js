/**
 *
 * @param page {import('puppeteer-core').Page}
 * @param {import('../../selectors.json')} selectors
 */
module.exports = async (page, selectors) => {
    await page.goto('https://cav.receita.fazenda.gov.br/ecac/Aplicacao.aspx?id=2&origem=maisacessados#', { waitUntil: 'networkidle0' })
    const iframeUrl = page.$eval('#frmApp', (element) => element.src)
    if (!iframeUrl) {
        throw new Error('Não foi possivel encontrar o iframe')
    }
    await page.goto(iframeUrl, { waitUntil: 'networkidle0' })
    const urlQuadroSocietario = await getUrlQuadroSocietario()
    console.log(urlQuadroSocietario)
}

async function getUrlQuadroSocietario() {
    const itensMenu = await page.$$('#menuPrincipal div')
    for (const [index, item] of Object.entries(itensMenu)) {
        const text = await item.$eval('a', (item) => item.textContent)
        if (text.trim() === 'Quadro de sócios e administradores') {
            return await item.$eval('a', (item) => item.href)
        }
    }

    return false
}
