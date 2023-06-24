const BASE_API_URL =
	(
		window.location.host ==
		"lazycat2.github.io"
		? "//185.13.47.146"
		: "//127.0.0.1"
	) + ":42069",
	USERNAMES = {
		revolt: "LazyCat#3080",
		discord: "uwushnick"
	}

copyFallback = text => {
	var textArea = document.createElement("textarea");
	textArea.value = text;
	  
	// Avoid scrolling to bottom
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.position = "fixed";
	
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	
	var successful = document.execCommand('copy');
	document.body.removeChild(textArea);
}

copy = text => {
  if (!navigator.clipboard) {
    copyFallback(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

addComment = data=> {
	$('#comments')
		.append(
			$('<div>')
				.addClass('comment')
				.append(
					$('<img>') 
						.attr('src', `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.webp?size=128`)
						.addClass('avatar')
				)
				.append(
					$('<div>')
						.append(
							$('<p>')
								.text(data.username)
								.css({ 
									margin: "0px 0px 10px 0px",
									fontWeight: "bolder"
								})
						)
						
						.append(
							$('<a>')
								.text(data.text)
						)
						
						.css({ textAlign: 'left' })
				)
		)
}

setCommentWriter = ()=>{
	axios
		.get(BASE_API_URL + "/me", { headers: { authorization: localStorage.token ?? "" } })
		.then(resp=>{
			const user = resp.data
			$('#create-comment')
				.append(
					$('<img>')
						.attr('src', `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`)
						.addClass('avatar')
						.css({ marginRight: '10px' })
				)
				.append(
					$('<input>')
						.css({
							width: '100%',
							fontSize: '25px',
							backgroundColor: 'var(--bg)',
							borderColor: 'transparent',
							borderRadius: '5px 0px 0px 5px'
						})
				)
				.append(
					$('<button>')
						.text('Post')
						.css({
							backgroundColor: '#5865f2',
							color: 'white',
							borderRadius: '0px 5px 5px 0px',
							cursor: 'pointer',
							borderColor: 'transparent',
							width: '75px',
							fontSize: '15px',
						})
						.on('click', ()=>{
							axios
								.post(
									BASE_API_URL + '/comment',
									{ text: $('#create-comment > input').val() },
									{ headers: { 
										authorization: localStorage.token
									}})
								.then(d=>{
									$('#comments > *').remove()
									axios
										.get(BASE_API_URL + '/comments')
										.then(res=>res.data.forEach(addComment))
								})
						})
				)
		})
		.catch(err=>{
			$('#create-comment')
				.append(
					$('<button>')
						.text('Log in')
						.css({
							backgroundColor: '#5865f2',
							color: 'white',
							borderRadius: '5px',
							cursor: 'pointer',
							borderColor: 'transparent',
							width: '75px',
							fontSize: '15px',
						})
						.on('click', ()=>{ window.location.href = "https://discord.com/api/oauth2/authorize?client_id=1050397287727243368&redirect_uri=https%3A%2F%2Flazycat2.github.io&response_type=code&scope=identify" })
				)
				.css({
					textAlign: 'center',
					display: "block"
				})
			
		})
}

$(()=>{
	axios
		.get("https://raw.githubusercontent.com/LazyCat2/lazycat2.github.io/main/README.md")
		.then(res=>{ document.getElementById("bio").innerText = res.data })

	url = new URL(window.location.href)
	code = url.searchParams.get("code")
	
	if (code) {
		console.log(code)
		f = true
		axios
			.get(BASE_API_URL + '/login', { headers: {authorization: code} })
			.then(res=>{ 
				console.log(res.data)
				localStorage.token = res.data.token
				setCommentWriter()
			})
			.catch(e=>{
				console.error(e)
				f = false
			})
	} else {
		setCommentWriter()
	}
	axios
		.get(BASE_API_URL + '/comments')
		.then(res=>res.data.forEach(addComment))
		
	$('.click-to-copy').on('mouseenter', e=>{
		serviceName = $(e.currentTarget).children(":first").attr('alt')
		username = USERNAMES[serviceName.toLowerCase()]
		$('#hint')
			.text(`${username} | ${serviceName} | Click to copy`)
			.css({ opacity: 1 })
	})

	$('.click-to-copy').on('mouseleave', e=>{
		$('#hint')
			.css({ opacity: 0 })
	})

	$('.click-to-copy').on('click', e=>{
		serviceName = $(e.currentTarget).children(":first").attr('alt')
		username = USERNAMES[serviceName.toLowerCase()]
		copy(username)
		$('#hint')
			.text(`${username} | ${serviceName} | Copied`)
			.css({ opacity: 1 })
	})
})
