
import { v4 as uuid } from 'uuid'
import PDFParser from 'pdf2json/pdfparser.js'
import Vulnerability from './VulnerabilityClass.js';
import fs, { stat } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const fsPromises = fs.promises

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class Analisys {
    constructor(
        author,
        pdf_name,
        save_results_path,
    ) {

        this.uuid = uuid();

        this.analisys_date = ()=>{
            let date = new Date()
            return `${date.getDay()}/${date.getMonth()}/${date.getFullYear()}at-${date.getHours()}:${date.getMinutes()}`
        }

        this.author = author
        this.pdf_name = pdf_name
        this.pdf_root_path = join(__dirname, 'locale_root')
        this.save_path = (save_results_path) ? save_results_path : `./temp/json/${pdf_name}_analisys_result.json`
        this.temp_buffer = []
        this.temp_json_path = `./temp/json/aux_temp.json`
        this.exit_code = 0
        this.analysis_vulnerability_temp_dir = []
        this.vulnerabilities_buffer = []
        this.statistics_save_path = `./temp/locale/${pdf_name}_stats.json`
    }



    async run_analisys() {
        this.analisys_date()
        try {
            this.parsePdf(this.pdf_name, () => {
                this.extractInfo(this.temp_json_path).then(() => {
                    for (let i = 0; i < this.analysis_vulnerability_temp_dir.length; i++) {
                        let vulnerability = {}
                        if(i < this.analysis_vulnerability_temp_dir.length-1){
                            vulnerability = new Vulnerability(this.temp_buffer.slice(this.analysis_vulnerability_temp_dir[i],this.analysis_vulnerability_temp_dir[i+1]))
                        }else{
                            vulnerability = new Vulnerability(this.temp_buffer.slice(this.analysis_vulnerability_temp_dir[i]))
                        }
                        vulnerability.main()
                            .then(data => {
                                this.vulnerabilities_buffer.push(data)
                            })
                            .catch(err => new Error(err))
                    }
                })
                .then(() => {
                    this.saveResults()
                })
                .then(() => {
                    this.cleanUp()
                })
            })

        } catch (err) {
            this.exit_code = 1
            console.error(err)
        } finally {
            console.log('Exited ', this.exit_code)
            return this.exit_code
        }
    }

    cleanUp() {
        //fsPromises.rm(this.temp_json_path)
    }

    async saveResults() {


        let analisys_result_buffer = this.vulnerabilities_buffer

        let stats = this.runStats(analisys_result_buffer)

        await fsPromises.writeFile(this.save_path, JSON.stringify(analisys_result_buffer))
        

        await fsPromises.writeFile(this.statistics_save_path,JSON.stringify(stats))

            


    }

    runStats(data_buffer) {
        let stats = {
            analisys_id:this.uuid,
            pdf_name: this.pdf_name,
            date: this.analisys_date(),
            total_vulnerabilities_found: data_buffer.length,
            vulnerabilities_per_file: {},
            vulnerabilities_per_type: {},
            vulnerabilities_per_root_object: {},

        }

        data_buffer.forEach((el) => {
            (!stats.vulnerabilities_per_file[el.root_file]) ? stats.vulnerabilities_per_file[el.root_file] = 1 : stats.vulnerabilities_per_file[el.root_file] += 1;
            (!stats.vulnerabilities_per_type[el.name]) ? stats.vulnerabilities_per_type[el.name] = 1 : stats.vulnerabilities_per_type[el.name] += 1;
            (!stats.vulnerabilities_per_root_object[el.root_object]) ? stats.vulnerabilities_per_root_object[el.root_object] = 1 : stats.vulnerabilities_per_root_object[el.root_object] += 1;
        })

        return stats
    }


    async extractInfo(json_path) {

        let text_buffer = await this.getText(json_path) // retorna un arreglo de objetos que contienen la informacion de las palabras del documento (coordenadas x,y y texto)

        let vul_directorio = [] // aqui se guardan los indices del comienzo de cada vulnerabilidad

        let detalles_index // gurda el indice del objetoque contiene la palabra detalles

        /**
         * 
         * A partir de aqui hay una oportunidad de mejora. Puede simplificarse drasticamente el codigo
         */

        text_buffer.every((word, index) => { // obtener el indice donde se encuentra la palabra detalles

            if (word.R[0].T == "Detalles") { // la logica de estre fragmento de codigo puede factorizarse 1. obtener las coordenadas de la palabra "Detalles" y excluir palabras a partir de su indice

                detalles_index = index
                return false
            }
            return true
        })

        let reducced_text = text_buffer.slice(detalles_index) // Recortamos el arreglo que contiene las palabras 
        detalles_index = 0 // reset
        let frs_sev_index = 0
        // ahora el indice donde se encuentra detalles es el 0
        reducced_text.forEach((word, index) => {
            if (word.R[0].T == "Severidad") { // buscar la palabra severidad

                let ind = this.goBackwards(reducced_text, index) // pasa el arrglo de palabras y el indice donde se encuentra la palabra severeidad

                vul_directorio.push(ind)
            }
        }) // obtendremos cada inicio de vulnerabilidad
        this.temp_buffer = reducced_text.slice(vul_directorio[0]) // recorda el array desde laprimera vul encontrada hasta la ultima
        this.analysis_vulnerability_temp_dir = vul_directorio.map(el => { // desplazamos el vector que contiene los indices de las vulnerabilidades
            return el - vul_directorio[0]
        })
        /**
         * Final de bloque factorizable
         */
        return;

    }

    goBackwards(arr, start_index) { // arreglo de palabras es recorrido en reversa a partir del indice de la palabra severidad

        for (let i = 1; i <= start_index; i++) {
            if (arr[start_index - i].x == 1.625) { // encontrar la primera palabra que este en la cordenada x = 1.625

                let index = start_index - i
                return index
            }

        }



    }

    async getText(json_path) {
        let text = []
        
        console.log(json_path)
        let data = await fsPromises.readFile(json_path)
        let doc = JSON.parse(data)
        let pages = doc.Pages
        let page_height = doc.Pages[0].Height
        pages.forEach((page, index) => {
            let aux_text = page.Texts
            aux_text = aux_text.map((text_el) => {
                text_el.y = text_el.y + page_height * index
                return text_el
            })
            text.push(aux_text)
        })
        return text.flat()

    }

    parsePdf(pdf_name, callback) {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", errData => new Error('error appened'));

        pdfParser.on("pdfParser_dataReady", pdfdata => {
            fs.writeFile(this.temp_json_path, JSON.stringify(pdfdata), (err) => { console.log(err) })
            callback()
        });

        pdfParser.loadPDF(join(this.pdf_root_path, pdf_name+'.pdf'))


    }
}

export default Analisys;