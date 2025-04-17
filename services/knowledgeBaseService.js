
async function addDocumentToUserKnowledgeBase(userId, fileName, vectorIds, supabase) {
    // Insert document metadata
    const { data: kbRecord, error: kbInsertError } = await supabase
      .from("knowledgeBase")
      .insert({ file_name: fileName, vector_ids: vectorIds, userId })
      .select("id")
      .single();
  
    if (kbInsertError) {
      throw new Error(`Insert error: ${kbInsertError.message}`);
    }
  
    // Fetch user's existing knowledgeBase array
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("knowledgeBase")
      .eq("id", userId)
      .single();
  
    if (profileErr && profileErr.code !== "PGRST116") {
      throw new Error(`Profile fetch error: ${profileErr.message}`);
    }
  
    const existing = profile?.knowledgeBase || [];
    const updated = [...new Set([...existing, kbRecord.id])];
  
    // Update profile with new knowledgeBase array
    const { data: updatedUser, error: updateErr } = await supabase
      .from("profiles")
      .update({ knowledgeBase: updated })
      .eq("id", userId)
      .select("*");
  
    if (updateErr) {
      throw new Error(`Profile update error: ${updateErr.message}`);
    }
  
    return updatedUser;
  }
  

  module.exports = { addDocumentToUserKnowledgeBase }