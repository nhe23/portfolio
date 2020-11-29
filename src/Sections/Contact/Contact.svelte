<script>
  import Form from "./Form.svelte";
  import ContactIllustration from "../../IllustrationComponents/ContactIllustration.svelte";
  document.querySelector("#remove-me").remove();
</script>

<style>
  section {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
    align-items: center;
  }
  .header{
    padding: 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    background-color: var(--theme-light);
    /* color: var(--theme-textColorPrimary) */
  }

  h1 {
    font-size: 35px;
  }
</style>

<div class="header">
  <h1>Let's create together</h1>
</div>

<section>
  <Form />

  <ContactIllustration />
</section>
