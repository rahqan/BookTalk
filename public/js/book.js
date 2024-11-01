async function loadReplies(discussId, parentId = null) {
  try {
    try {
      console.log("Fetching replies...");
      const response = await fetch(
        `/get-replies?discuss_id=${discussId}&parent_id=${parentId}`
      );
      const replies = await response.json();

      // selects the child div if parent exists else selects the main div to display the duscussions
      // now in div say the parent div first we put the replies that we got fomr the db for parent==null
      // then we select the repliesReply div to display the replies
      const repliesDiv = document.getElementById(
        parentId ? `repliesReply-${parentId}` : `replies-${discussId}`
      );

      if (replies.length > 0) {
        // for each of the div that we selct we add a button that calls the loadreplies child by giving the discussionid and the current id(replies-id) as the parent id
        
        const replyList = replies
        
          .map(
            (reply) => `
                  <div style="margin-left: 20px; background-color: #F4F1EA;">
                      <p><strong>User:</strong> ${reply.user_id}</p>
                      <p>${reply.text}</p>
                      

                        
            

<input type="text" id="replyReplyText-${reply.id}" placeholder="Type your reply here" onfocus="expandInput(this)" >
<button onclick="sendReply(${discussId}, ${reply.id})">Reply</button>





                      <button onclick="loadReplies(${discussId}, ${reply.id})">Show Replies</button>

                      <div id="repliesReply-${reply.id}" style="display: none;"></div>
                  </div>
              `
          )
          .join("")
          ;
        // console.log(replyList);

        //     <div style="margin-left: 20px; background-color: #F4F1EA;">
        //     <p><strong>User:</strong> 2</p>
        //     <p>Holden is a complex character; he’s relatable yet frustrating.</p>
        //     <button onclick="loadReplies(1, 1)">Show Replies</button>

        //     <div id="repliesReply-1" style="display: none;"></div>
        // </div>

        // <div style="margin-left: 20px; background-color: #F4F1EA;">
        //     <p><strong>User:</strong> 3</p>
        //     <p>His contradictions make him real to me.</p>
        //     <button onclick="loadReplies(1, 2)">Show Replies</button>

        //     <div id="repliesReply-2" style="display: none;"></div>
        // </div>

        // <div style="margin-left: 20px; background-color: #F4F1EA;">
        //     <p><strong>User:</strong> 4</p>
        //     <p>I agree, he’s very well written.</p>
        //     <button onclick="loadReplies(1, 3)">Show Replies</button>

        //     <div id="repliesReply-3" style="display: none;"></div>
        // </div>

        // <div style="margin-left: 20px; background-color: #F4F1EA;">
        //     <p><strong>User:</strong> 4</p>
        //     <p>I agree, he’s very well written.</p>
        //     <button onclick="loadReplies(1, 119)">Show Replies</button>

        //     <div id="repliesReply-119" style="display: none;"></div>
        // </div>

        repliesDiv.innerHTML = replyList;
        repliesDiv.style.display = "block";
      } else {
        // repliesDiv.innerHTML = "<p>No replies available.</p>";
        // repliesDiv.style.display = "block";
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  } catch (error) {
    console.error("Error fetching replies:", error);
  }
}

async function sendDiscussion(book_id) {
  try {
    // Get the reply text from the input field
    const replyText = document.getElementById("discussText").value;

    // Ensure the reply text is not empty
    if (!replyText.trim()) {
      alert("Please enter a reply.");
      return;
    }

    // Send the reply to the server
    const response = await fetch(
      `/post-discuss?book_id=${book_id}&text=${encodeURIComponent(replyText)}`,
      {
        method: "POST",
      }
    );

    if (response.ok) {
      alert("Reply posted successfully!");
      // location.reload(); // Reload the page to show the new reply (optional)
    } else {
      alert("Failed to post the reply.");
    }
  } catch (error) {
    console.error("Error posting reply:", error);
  }
  document.getElementById('discussText').value = '';
  
}

async function sendReply(discuss_id, parent_id = null) {
  try {
    let replyText;

    if (parent_id === null) {
      // If it's a reply to the main discussion, use the main reply input field
      replyText = document.getElementById(`replyText-${discuss_id}`).value;
    } else {
      // If it's a reply to a specific reply, use the specific reply input field
      replyText = document.getElementById(`replyReplyText-${parent_id}`).value;
    }

    // Ensure the reply text is not empty
    if (!replyText.trim()) {
      alert("Please enter a reply.");
      return;
    }

    // Send the reply to the server
    const response = await fetch(
      `/post-reply?discuss_id=${discuss_id}&parent_id=${parent_id}&text=${encodeURIComponent(
        replyText
      )}`,
      {
        method: "POST",
      }
    );

    if (response.ok) {
      alert("Reply posted successfully!");
      // location.reload(); // Reload the page to show the new reply (optional)
    } else {
      alert("Failed to post the reply.");
    }
  } catch (error) {
    console.error("Error posting reply:", error);
  }

  // Clear the input field after posting the reply
  if (parent_id === null) {
    document.getElementById(`replyText-${discuss_id}`).value = ''; // Clear the main discussion reply input
  } else {
    document.getElementById(`replyReplyText-${parent_id}`).value = ''; // Clear the specific reply input
  }
}
