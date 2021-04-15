<script>
	import Dashboard from './components/dashboard.svelte'
	import { io } from "socket.io-client"
	let master, masterStatus = false
	master = io('http://localhost:4000', {
		withCredentials: false
	})
  $: masterStatus = true

  master.on('connect', () => {
    masterStatus = true
  }).on('disconnect', () => {
    masterStatus = false
  })
</script>

<style>

	.cant-connect {
		position: absolute;
		width: -webkit-fill-available;
		height: -webkit-fill-available;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		backdrop-filter: blur(5px);
		text-align: center;
		z-index: 2;
	}

	.cant-connect .icon {
		position: absolute;
		top: 36%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 10em;
	}

	.cant-connect p {
		position: absolute;
		top: 49%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 2em;
		font-family: 'Nunito-Black';
	}

	.cant-connect p.status {
		top: 57%;
		font-size: 1em;
		font-family: 'Nunito-Regular';
	}

	.hidden {
		display: none!important;
	}
	
</style>

<main>
	<Dashboard master={ master }/>
</main>

<div class='cant-connect' class:hidden={ masterStatus }>
	<i class="far fa-frown icon"></i>
	<p>Can't connect to master server!</p> 
	<p class='status'>Retrying...</p>
</div>