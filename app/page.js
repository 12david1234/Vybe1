
useEffect(() => {
  let active = true;

  async function getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (!active) return;

    if (error || !data.session) {
      window.location.replace("/auth");
      return;
    }

    setSession(data.session);
    setAuthReady(true);
  }

  getSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, newSession) => {
    if (!newSession) {
      window.location.replace("/auth");
      return;
    }

    setSession(newSession);
    setAuthReady(true);
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}, []);
