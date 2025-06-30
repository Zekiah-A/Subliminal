#define CLAY_IMPLEMENTATION
#include "clay.h"

typedef struct
{
	Clay_Vector2 click_origin;
	Clay_Vector2 position_origin;
	bool mouse_down;
} ScrollbarData;

ScrollbarData scrollbar_data = {};

typedef struct
{
	void* memory;
	uintptr_t offset;
} Arena;

Arena frame_arena = {};

typedef struct
{
	float width;
	float height;
} ViewportSize;

typedef struct
{
	float mouse_x;
	float mouse_y;
	bool mouse_down;
	bool touch_down;
	float scroll_x;
	float scroll_y;
} PointerState;

typedef struct
{
	bool arrow_down;
	bool arrow_up;
	bool d_key;
} KeyboardInputFlags;

typedef struct
{
	ViewportSize viewport;
	PointerState pointer;
	KeyboardInputFlags keys;
	float delta_time;
} FrameInput;

double window_width = 1920;
double window_height = 1080;
bool debug_mode_enabled = false;
uint32_t active_renderer_index = 0;

CLAY_WASM_EXPORT("set_scratch_memory") void set_scratch_memory(void* memory)
{
	frame_arena.memory = memory;
}

CLAY_WASM_EXPORT("update_draw_frame") Clay_RenderCommandArray update_draw_frame(FrameInput* input)
{
	frame_arena.offset = 0;

	window_width = input->viewport.width;
	window_height = input->viewport.height;
	Clay_SetLayoutDimensions((Clay_Dimensions) {
		input->viewport.width, input->viewport.height
	});

	Clay_ScrollContainerData scroll_container_data = Clay_GetScrollContainerData(
		Clay_GetElementId(CLAY_STRING("OuterScrollContainer"))
	);

	if (input->keys.d_key) {
		debug_mode_enabled = !debug_mode_enabled;
		Clay_SetDebugModeEnabled(debug_mode_enabled);
	}

	Clay_SetCullingEnabled(active_renderer_index == 1);
	Clay_SetExternalScrollHandlingEnabled(active_renderer_index == 0);
	Clay__debugViewHighlightColor = (Clay_Color){105, 210, 231, 120};

	Clay_SetPointerState(
		(Clay_Vector2){input->pointer.mouse_x, input->pointer.mouse_y},
		input->pointer.mouse_down || input->pointer.touch_down
	);

	if (!input->pointer.mouse_down) {
		scrollbar_data.mouse_down = false;
	}

	if (input->pointer.mouse_down &&
		!scrollbar_data.mouse_down &&
		Clay_PointerOver(Clay_GetElementId(CLAY_STRING("ScrollBar")))) {
		scrollbar_data.click_origin = (Clay_Vector2){input->pointer.mouse_x, input->pointer.mouse_y};
		scrollbar_data.position_origin = *scroll_container_data.scrollPosition;
		scrollbar_data.mouse_down = true;
	}
	else if (scrollbar_data.mouse_down) {
		if (scroll_container_data.contentDimensions.height > 0) {
			Clay_Vector2 ratio = {
				scroll_container_data.contentDimensions.width / scroll_container_data.scrollContainerDimensions.width,
				scroll_container_data.contentDimensions.height / scroll_container_data.scrollContainerDimensions.height
			};

			if (scroll_container_data.config.vertical) {
				scroll_container_data.scrollPosition->y =
					scrollbar_data.position_origin.y +
					(scrollbar_data.click_origin.y - input->pointer.mouse_y) * ratio.y;
			}
			if (scroll_container_data.config.horizontal) {
				scroll_container_data.scrollPosition->x =
					scrollbar_data.position_origin.x +
					(scrollbar_data.click_origin.x - input->pointer.mouse_x) * ratio.x;
			}
		}
	}

	if (input->keys.arrow_down) {
		if (scroll_container_data.contentDimensions.height > 0) {
			scroll_container_data.scrollPosition->y -= 50;
		}
	}
	else if (input->keys.arrow_up) {
		if (scroll_container_data.contentDimensions.height > 0) {
			scroll_container_data.scrollPosition->y += 50;
		}
	}

	Clay_UpdateScrollContainers(
		input->pointer.touch_down,
		(Clay_Vector2){input->pointer.scroll_x, input->pointer.scroll_y},
		input->delta_time
	);

	Clay_BeginLayout();
	return Clay_EndLayout();
}
