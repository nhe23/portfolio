<script>
  // import Input from "./Input.svelte";
</script>

<style>
  .formContainer {
    height: 100%;
    flex: 1 1 300px;
  }
  .formCard {
    background-color: var(--theme-light);
    padding: 20px;
    border-radius: 30px;
    padding: 20px;
    max-width: 500px;
    margin: 25px auto;
  }

  form {
    display: flex;
    flex-direction: column;
  }
  button[type="submit"] {
    display: block;
    margin: 0 auto;
    margin-top: 15px;
    background-color: var(--theme-secondary);
    color: var(--theme-textColorPrimary);
    border-radius: 20px;
    padding: 5px 35px;
    width: fit-content;
    margin-top: 20px;
    cursor: pointer;
  }

  input,
  textarea {
    background-color: var(--theme-light);
    /* background-color: var(--theme-primary); */
    /* color: var(--theme-textColorPrimary); */
    margin: 20px;
  }
  input::placeholder,
  textarea::placeholder {
    /* color: var(--theme-textColorPrimary); */
  }

  textarea {
    /* border-color: var(--theme-textColorPrimary); */
  }

  input {
    border: none;
    border-bottom: 1px solid;
  }
</style>

<div class="formContainer">
  <div class="formCard">
    <form name="contact" method="POST">
      <input type="hidden" name="form-name" value="contact" />
      <p style="display: none">
        <label
          >Don’t fill this out if you're human:
          <input name="bot-field" /></label
        >
      </p>
      <input type="text" name="Name" placeholder="Name" />
      <input type="email" name="Email" placeholder="Email" />
      <textarea name="Message" placeholder="Message" rows="10" />
      <button type="submit">Send</button>
    </form>
  </div>
</div>
