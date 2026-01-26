import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Fetch all active members with courtesy calls enabled
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, first_name, last_name, phone, created_at")
      .eq("status", "active")
      .eq("courtesy_calls_enabled", true);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      throw membersError;
    }

    console.log(`Found ${members?.length || 0} active members with courtesy calls enabled`);

    let tasksCreated = 0;
    let tasksSkipped = 0;

    for (const member of members || []) {
      const memberCreatedAt = new Date(member.created_at);
      const memberDay = memberCreatedAt.getDate();

      // Check if today is the member's monthly anniversary
      if (memberDay !== todayDay) {
        continue;
      }

      // Check if a courtesy call task already exists for this member this month
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);

      const { data: existingTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .eq("member_id", member.id)
        .eq("task_type", "courtesy_call")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString())
        .neq("status", "completed");

      if (tasksError) {
        console.error(`Error checking existing tasks for member ${member.id}:`, tasksError);
        continue;
      }

      if (existingTasks && existingTasks.length > 0) {
        console.log(`Courtesy call task already exists for member ${member.id} this month`);
        tasksSkipped++;
        continue;
      }

      // Create new courtesy call task
      const dueDate = new Date();
      dueDate.setHours(17, 0, 0, 0); // Set due time to 5 PM

      const { error: insertError } = await supabase.from("tasks").insert({
        title: `Monthly Courtesy Call - ${member.first_name} ${member.last_name}`,
        description: `Monthly check-in call for ${member.first_name} ${member.last_name}. Phone: ${member.phone || 'N/A'}`,
        member_id: member.id,
        task_type: "courtesy_call",
        priority: "normal",
        status: "pending",
        due_date: dueDate.toISOString(),
      });

      if (insertError) {
        console.error(`Error creating courtesy call task for member ${member.id}:`, insertError);
        continue;
      }

      console.log(`Created courtesy call task for member ${member.id}`);
      tasksCreated++;

      // Update next courtesy call date for the member
      const nextMonth = new Date(currentYear, currentMonth + 1, memberDay);
      await supabase
        .from("members")
        .update({ next_courtesy_call_date: nextMonth.toISOString().split("T")[0] })
        .eq("id", member.id);
    }

    const response = {
      success: true,
      date: today.toISOString(),
      tasksCreated,
      tasksSkipped,
      totalMembersChecked: members?.length || 0,
    };

    console.log("Courtesy call generation complete:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error generating courtesy calls:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
