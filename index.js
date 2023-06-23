require('dotenv').config({ path: '.env' })

const
	express = require('express'),
	db = require('better-sqlite3')('./db.db'),
	cors = require('cors'),
	axios = require('axios');

app = express()
	.use(cors())
	.use(express.json())
	
	.get('/', (req, res)=>
		res.json({
			alive: true
		})
	)

	.get('/comments', (req, res)=>{
		const comments = Array
			.from(db
				.prepare('SELECT * FROM comments ORDER BY created_at DESC')
				.iterate()
			)

		const users = Array
			.from(db
				.prepare('SELECT * FROM users')
				.iterate()
			)

		const output = Array.from([])

		comments
			.forEach(c=>{
				u = users.find(u=>u.id==c.id)
				output.push({
					id: c.id,
					avatar: u.avatar,
					username: u.username,
					created_at: c.created_at,
					text: c.text
				})
			})
		
		res.json(output)
	})

	.post('/comment', (req, res)=>{
		const user = db
			.prepare('SELECT avatar, username, id FROM users WHERE token=?')
			.get(req.headers.authorization)
			
		if (!user) return res.send(401, 'Unauthorized | use `authorization` header');

		exists = db
			.prepare('SELECT id FROM comments WHERE id=?')
			.get(user.id)
		if (exists)
			db
				.prepare('UPDATE comments SET text=? WHERE id=?')
				.run(req.body.text, user.id)
		else
			db
				.prepare('INSERT INTO comments VALUES (?,?,?)')
				.run(user.id, req.body.text, Date.now())
		
		res.json({ success: true })
	})

	.get('/me', (req, res)=>{
		const user = db
			.prepare('SELECT avatar, username, id FROM users WHERE token=?')
			.get(req.headers.authorization)
			
		if (!user) return res.send(401, 'Unauthorized | use `authorization` header');
		res.json(user)
	})

	.get('/login', (req, res)=>{
		console.log("asdf")
		data = new URLSearchParams({
			'client_id': process.env.client_id,
			'client_secret':process.env.client_secret,
			'grant_type': 'authorization_code',
			'redirect_uri': 'https://lazycat2.github.io',
			'code': req.headers.authorization
		})
		
		axios
			.post("https://discord.com/api/oauth2/token", data.toString(), {
				headers: {
		            "Content-type": "application/x-www-form-urlencoded"
				}
			})
			.then(d=>{
				axios
					.get('https://discord.com/api/users/@me', {
						headers: {
							"Authorization": "Bearer " +d.data.access_token
						}
					})
					.then(d=>{
						user = db
							.prepare('SELECT id FROM users WHERE id=?')
							.get(d.data.id)
						if (user) {
							db
								.prepare('UPDATE users SET avatar=?, username=?')
								.run(d.data.avatar, d.data.username)
						} else {
							require('crypto').randomBytes(256, function(err, buffer) {
								db
									.prepare('INSERT INTO users VALUES (?,?,?,?)')
									.run(d.data.id, d.data.username, d.data.avatar, buffer.toString('hex'))
							});
						}

						res.json(
							db
								.prepare('SELECT token FROM users WHERE id=?')
								.get(d.data.id)
						)
					})
			})
			.catch(a=>console.log(a, data))
	})
	
	.listen(42069)
