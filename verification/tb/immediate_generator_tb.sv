`timescale 1ns / 1ps

module immediate_generator_tb;

logic [31:0] instruction;
logic [31:0] immediate;

immediate_generator dut(
    .instruction(instruction),
    .immediate(immediate)
);

initial begin

    $display("==============================");
    $display(" Immediate Generator Test");
    $display("==============================");

    // I-Type
    instruction = 32'h00A00093;
    #10;
    if(immediate == 32'd10)
        $display("[PASS] I-Type");
    else
        $display("[FAIL] I-Type");

    // U-Type (LUI)
    instruction = 32'h12345037;
    #10;
    if(immediate == 32'h12345000)
        $display("[PASS] U-Type");
    else
        $display("[FAIL] U-Type");

    $display("==============================");
    $display(" Immediate Generator Complete");
    $display("==============================");

    $finish;

end

endmodule