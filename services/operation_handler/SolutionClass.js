import { fprintf } from './solutions_scripts/index.js'

class Solution {
    constructor(project_name, project_folder, s_ver, vulnerability) {
        this.vul_json = vulnerability
        this.project_name = project_name // nombre del projecto example "VALIDADORDEAPORTACIONESVOLUNTARIAS"
        this.version = s_ver
        this.project_folder = project_folder // donde se encuentra lo que la clase va a modificar
        this.languaje_target = ''
        this.sol_identifier = ''
        
    }
    comprobe_vul_sol() {
        let {
            name,
            root_file,
            root_line,
            root_object,
            root_method,
            root_vulnerability_lines } = this.vul_json;

        if (name === 'Dangerous_Functions' && root_object === 'sprintf') {
            this.sol_identifier = 'DFsprintf'
            return true;
        }
        return false

    }

    verify_header(){
        return;
    }

    perform_solution() {

        switch (this.sol_identifier) {
            case 'DFsprintf':
                fprintf(this.vul_json, this.project_folder)
                    .then(done => {
                        return 'ok'
                    }).catch(err => {
                        console.error(err)
                        return 'fail'
                    })
                break;

            default:
                break;
        }
    }

}
export default Solution