<TutorialsCard
  v-for="tutorialItem in tutorials.slice(0, 4)"
  :key="tutorialItem.title"
  :tutorial-item="tutorialItem"
  source="dashboard"
/>

<FormButton
  color="outline"
  size="sm"
  :to="tutorialsRoute"
  @click="mixpanel.track('View more tutorials clicked', { source: 'dashboard' })"
>
  View more
</FormButton>
