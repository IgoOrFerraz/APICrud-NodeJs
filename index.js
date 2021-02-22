let bodyParser = require('body-parser')
let app = require('express')()
let expressSession = require('express-session')
let mysql = require('mysql')

app.use(bodyParser.json())

app.use(expressSession({
	secret: 'testsession',
	resave: false,
	saveUninitialized: false 
}));

let dbConnection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '1234'
})

dbConnection.connect((error) => {
    if (error){ console.log('Erro de Conexão \n'+error) }
    else { 
        console.log('DB conectado com Sucesso')
        
        let sql_users = "CREATE TABLE IF NOT EXISTS db_users.Users (id_user int NOT NULL AUTO_INCREMENT, nome varchar(30) NOT NULL, login varchar(30) NOT NULL, senha varchar(50) NOT NULL, PRIMARY KEY (id_user))"
        let sql_registers = "CREATE TABLE IF NOT EXISTS db_users.Registers (id_register int NOT NULL AUTO_INCREMENT, id_user int NOT NULL, nome varchar(30), dataregistro DATE NOT NULL, complemento varchar(50), PRIMARY KEY(id_register), FOREIGN KEY (id_user) REFERENCES db_users.users(id_user))"
    
        dbConnection.query(sql_users, (error) => { if(error) throw error })

        dbConnection.query(sql_registers, (error) => { if(error) throw error })
    }
});

app.listen(80, () => { console.log('Servidor Rodando na Porta 80') })

app.post('/cadastrar', function(req, res){

    /* nome, login, senha */
    let dadosForm = req.body
    
    dbConnection.query("INSERT INTO db_users.Users SET ?", [dadosForm], (error) => {
        if(error){
            throw error
        } else{
            res.send(`Usuario ${req.body.nome} Cadastrado com Sucesso`)
        }
    })
})

app.post('/logar', function(req, res){

    /* login, senha */
    let dadosForm = req.body
    
    dbConnection.query("SELECT * FROM db_users.users WHERE login = ? AND senha = ? LIMIT 1", [dadosForm.login, dadosForm.senha], function(error, results){
        
        if(error) throw error 
        
        if(results[0] != undefined){
            req.session.autorizado = true
            req.session.id_user = results[0].id_user
            req.session.nome = results[0].nome

            res.send(`Usuário ${req.session.nome} Logado com Sucesso`)
        }
    })
})

app.post('/inserirRegistro', function(req, res){

    /* nome, dataregistro(yyyy-mm-dd), complemento */
    let dadosForm = req.body

    if(!req.session.autorizado) res.send('Favor Realizar o Login')
    else{
        dadosForm.id_user = req.session.id_user
    
        dbConnection.query("INSERT INTO db_users.registers SET ?", [dadosForm], function(error){
            
            if(error) throw error 
            else res.send(`Registro ${dadosForm.nome} Inserido com Sucesso`)
            
        })
    }
})

app.get('/registros', function(req, res){

    dbConnection.query("SELECT * FROM db_users.registers", function(error, result){
        
        if(error) throw error
        else if(result) res.send(result)
        
    })
})

app.get('/usuarios', function(req, res){

    dbConnection.query("SELECT * FROM db_users.users", function(error, result){
        
        if(error) throw error
        else if(result) res.send(result)
        
    })
})

app.delete('/deletarRegistro/:id_register', function(req, res){

    dbConnection.query("DELETE FROM db_users.registers WHERE id_register = ? LIMIT 1",[req.params.id_register], function(error){
        
        if(error) throw error
        else res.send("Registro Deletado com Sucesso")
        
    })
})

app.put('/atualizarRegistro', function(req, res){
    /* id_register, nome, dataregistro, complemento */
    dadosForm = req.body

    dbConnection.query("UPDATE db_users.registers SET ? WHERE id_register = ?",[dadosForm, dadosForm.id_register], function(error){
    
        if(error) throw error
        else res.send(`Registro ${dadosForm.nome} Atualizado com Sucesso`)

    })
})

app.put('/atualizarUsuario', function(req, res){
    /* nome, login, senha */
    dadosForm = req.body
    if(!req.session.autorizado) res.send('Favor Realizar o Login')
    else{
        dbConnection.query("UPDATE db_users.users SET ? WHERE id_user = ?",[dadosForm, req.session.id_user], function(error){
    
            if(error) throw error
            else{
                res.send(`Usuario ${dadosForm.nome} Atualizado com Sucesso`)
                req.session.destroy()
            }
        })
    }
})