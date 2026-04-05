import { Box, Text, useInput } from "ink";
import React from "react";
import { useState } from "react";
import type { Option } from "../../types/index.js";

interface OptionListProps {
	options: Option[];
	type: "single" | "multi";
	value: string | string[] | null;
	onChange: (value: string | string[]) => void;
	onBack?: () => void;
}

export const OptionList: React.FC<OptionListProps> = ({
	options,
	type,
	value,
	onChange,
	onBack,
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const isSelected = (optValue: string) => {
		if (type === "single") return value === optValue;
		return Array.isArray(value) && value.includes(optValue);
	};

	const toggleOption = (optValue: string) => {
		if (type === "single") {
			onChange(optValue);
		} else {
			const current = Array.isArray(value) ? value : [];
			const newValue = current.includes(optValue)
				? current.filter((v) => v !== optValue)
				: [...current, optValue];
			onChange(newValue);
		}
	};

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex((prev) => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1));
		} else if (key.return) {
			toggleOption(options[selectedIndex].value);
		} else if (key.escape && onBack) {
			onBack();
		}
	});

	return (
		<Box flexDirection="column">
			{options.map((opt, index) => {
				const selected = isSelected(opt.value);
				const highlighted = index === selectedIndex;

				return (
					<Box key={opt.value}>
						<Text>
							{highlighted ? ">" : " "}{" "}
							{type === "multi"
								? selected
									? "[x]"
									: "[ ]"
								: selected
									? "(*)"
									: "( )"}{" "}
							<Text bold={highlighted}>{opt.label}</Text>
							{opt.badge && (
								<Text color={getBadgeColor(opt.badge)}> [{opt.badge}]</Text>
							)}
						</Text>
						{opt.description && <Text dimColor> - {opt.description}</Text>}
					</Box>
				);
			})}
		</Box>
	);
};

function getBadgeColor(badge: string): string {
	switch (badge) {
		case "recommended":
			return "green";
		case "popular":
			return "blue";
		case "experimental":
			return "yellow";
		case "legacy":
			return "gray";
		default:
			return "white";
	}
}

export default OptionList;
