<script>
  
export let client

let name = ''
let password = ''
let error = false

let authorize = () => {
  if(name.length == 0 || password.length == 0) {
    error = true
  } else {
    client.setClient(name)
  }
}

</script>

<style>

  h1.logo {
    width: 50%;
    margin: 0 auto;
    display: block;
    text-align: center;
    background: #00ffb8;
    color: white;
  }

  .error {
    position: absolute;
    top: 5vh;
    right: 5vw;
    padding: 1vw;
    color: white;
    font-size: .6vw;

  }

  .error.danger {
    background: #ff0000ba;
  }

  .auth {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .inputs {
    width: 50%;
    margin: 0 auto;
    display: block;
    text-align: center;
  }

  .inputs .input {
    display: block;
    width: 100%;
    margin-left: -50%;
    margin-top: 0vh;
  }

  .inputs .input p {
    text-align: left;
    margin-bottom: .7vh;
  }

  .inputs .input input[type="text"] {
    border-radius: 0px;
    border: 1px solid #9c9c9c;
    width: 10vw;
  }

  .inputs .input input[type="text"]:focus {
    outline: none;
  }

  button {
    color: #fff;
    background-color: #1a1a1a;
    display: block;
    float: right;
    width: 4vw;
  }

  
</style>

{#if error}
  <div class='error danger'>
    Please, enter username and password.
  </div>
{/if}

<div class='auth'>
  <h1 class='logo' style="background-color: #{ Math.floor(Math.random()*16777215).toString(16) }">Kinai</h1>

  <div class="inputs">
    <div class='input' style='margin-top: 5vh'>
      <p>Username</p>
      <input type='text' bind:value={name}/>
    </div>
    <div class='input'>
      <p>Password</p>
      <input type='text' bind:value={password}/>
    </div>
  </div>

  <button on:click={authorize}>LOGIN</button>
</div>