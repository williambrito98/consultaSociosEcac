require('dotenv').config()
const { workerData, Worker, isMainThread, parentPort } = require('worker_threads')
const app = require('./app')
const SELECTORS = require('../selectors.json')
const workerEvents = require('./events/workerEvents')
const setVariables = require('./setVariables')
const { join, parse } = require('path')
const { rmSync } = require('fs')
const { appendFileSync } = require('fs');

(async () => {
    if (isMainThread) {
        const worker = new Worker(__filename, {
            workerData: {
                values: [],
                __root_dir: process.cwd()
            }
        })
        require('dotenv').config({
            path: join(parse(__dirname).dir, '.env')
        })
        worker.on('message', (message) => {
            process.stdout.write(message)
            if (process.env.CREATE_CONSOLE_FILE === 'false') return true
            appendFileSync(join(process.cwd(), 'saida', 'console.txt'), `${message}\n`)
        })
        worker.on('exit', () => console.log('FIM'))
        worker.on('online', () => console.log('running'))
        worker.on('error', (error) => console.log(error))
        // worker.postMessage('close')
    } else {
        require('dotenv').config({
            path: join(workerData.__root_dir, '.env')
        })
        workerEvents()
        setVariables(workerData.__root_dir)
        const data = workerData
        while (true) {
            const execution = await app(data, SELECTORS, parentPort.postMessage.bind(parentPort))
            if (!execution.status) {
                if (!execution.continue) {
                    appendFileSync(join(global.pathSaida, 'erros.csv'), `${execution.error}\n`)
                    break
                }
                if (execution.repeat) {
                    if (global.attempts > 3) {
                        appendFileSync(join(global.pathSaida, 'erros.csv'), `${data.values[execution.lastIndex]?.cnpj};${execution.error}\n`)
                        data.values = data.values.filter((item, index) => index > execution.lastIndex)
                        global.attempts = 0
                        continue
                    }
                    data.values = data.values.filter((item, index) => index >= execution.lastIndex)
                    global.attempts++
                    continue
                }
                appendFileSync(join(global.pathSaida, 'erros.csv'), `${data.values[execution.lastIndex]?.cnpj};${execution.error}\n`)
                data.values = data.values.filter((item, index) => index > execution.lastIndex)
                global.attempts = 0
                continue
            }
            break
        }

        rmSync(global.pathTemp, { force: true, recursive: true })
        process.exit()
    }
})()
